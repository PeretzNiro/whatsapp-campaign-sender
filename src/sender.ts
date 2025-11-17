import PQueue from "p-queue";
import { sendTemplate } from "./whatsapp.js";
import { Contact as LegacyContact } from "./types.js";
import { Contact as DBContact, db, countryLimits, campaigns, deliveryEvents, templates } from "./db/index.js";
import { env } from "./env.js";
import { extractCountryCode } from "./utils/phone.js";
import { eq } from "drizzle-orm";

// Country-specific queue management
const countryQueues = new Map<string, PQueue>();

async function getQueueForCountry(countryCode: string): Promise<PQueue> {
  if (countryQueues.has(countryCode)) {
    return countryQueues.get(countryCode)!;
  }

  // Try to get country-specific limits from database
  let maxPerSecond = env.SEND_MAX_PER_SECOND;
  let maxConcurrency = env.SEND_CONCURRENCY;

  try {
    const [limit] = await db.select()
      .from(countryLimits)
      .where(eq(countryLimits.countryCode, countryCode));

    if (limit && limit.enabled) {
      maxPerSecond = limit.maxPerSecond;
      maxConcurrency = limit.maxConcurrency;
    } else {
      // Try fallback to default limit (*)
      const [defaultLimit] = await db.select()
        .from(countryLimits)
        .where(eq(countryLimits.countryCode, '*'));

      if (defaultLimit && defaultLimit.enabled) {
        maxPerSecond = defaultLimit.maxPerSecond;
        maxConcurrency = defaultLimit.maxConcurrency;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch limits for ${countryCode}, using defaults`, error);
  }

  const queue = new PQueue({
    concurrency: maxConcurrency,
    interval: 1000,
    intervalCap: maxPerSecond,
  });

  countryQueues.set(countryCode, queue);
  return queue;
}

export async function sendBatch({
  contacts,
  limit,
  bodyText,
  dryRun,
  components,
  templateId,
  tag,
  campaignId,
}: {
  contacts: (LegacyContact | DBContact)[];
  limit: number;
  bodyText: string;
  dryRun?: boolean;
  components?: any[];
  templateId?: number;
  tag?: string;
  campaignId?: string;
}) {
  // Fetch template if templateId is provided
  let templateName = "hello_world";
  let languageCode = "en_US";

  if (templateId) {
    try {
      const [template] = await db.select()
        .from(templates)
        .where(eq(templates.id, templateId));

      if (template) {
        templateName = template.name;
        languageCode = template.language;
      }
    } catch (error) {
      console.error('Failed to fetch template, using defaults', error);
    }
  }

  const eligible = contacts.filter(c => {
    const optedIn = ('opt_in' in c) ? c.opt_in : c.optIn;
    return optedIn && c.phone;
  }).slice(0, limit);

  // Group contacts by country
  const contactsByCountry = new Map<string, typeof eligible>();
  for (const contact of eligible) {
    const countryCode = extractCountryCode(contact.phone) || '*';
    if (!contactsByCountry.has(countryCode)) {
      contactsByCountry.set(countryCode, []);
    }
    contactsByCountry.get(countryCode)!.push(contact);
  }

  const results: any[] = [];

  // Process each country group with its own queue
  const countryPromises = Array.from(contactsByCountry.entries()).map(async ([countryCode, countryContacts]) => {
    const queue = await getQueueForCountry(countryCode);

    for (const c of countryContacts) {
      queue.add(async () => {
        if (dryRun) {
          results.push({ to: c.phone, ok: true, dryRun: true });

          // Store dry run event
          if (campaignId) {
            try {
              await db.insert(deliveryEvents).values({
                campaignId,
                phone: c.phone,
                status: 'dry_run',
              });
            } catch (error) {
              console.error('Failed to store dry run event', error);
            }
          }
          return;
        }

        let attempt = 0;
        while (true) {
          try {
            const data = await sendTemplate(c.phone, bodyText, templateName, languageCode, components);
            const messageId = data?.messages?.[0]?.id;

            results.push({ to: c.phone, ok: true, id: messageId });

            // Store delivery event
            if (campaignId && messageId) {
              try {
                await db.insert(deliveryEvents).values({
                  campaignId,
                  phone: c.phone,
                  messageId,
                  status: 'sent',
                });
              } catch (error) {
                console.error('Failed to store delivery event', error);
              }
            }

            return;
          } catch (err: any) {
            attempt++;
            if (attempt >= env.RETRY_MAX_ATTEMPTS) {
              const errorMsg = err?.response?.data || String(err);
              results.push({ to: c.phone, ok: false, error: errorMsg });

              // Store failed event
              if (campaignId) {
                try {
                  await db.insert(deliveryEvents).values({
                    campaignId,
                    phone: c.phone,
                    status: 'failed',
                    errorMessage: JSON.stringify(errorMsg),
                  });
                } catch (error) {
                  console.error('Failed to store failed event', error);
                }
              }

              return;
            }
            await new Promise(r => setTimeout(r, env.RETRY_BASE_MS * Math.pow(2, attempt - 1)));
          }
        }
      });
    }

    await queue.onIdle();
  });

  // Wait for all country queues to finish
  await Promise.all(countryPromises);

  return {
    total: eligible.length,
    sent: results.filter(r => r.ok).length,
    results,
  };
}
