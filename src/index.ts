import "dotenv/config";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env.js";
import { loadContacts } from "./contacts.js";
import { sendBatch } from "./sender.js";
import { webhook } from "./webhook.js";
import { templatesRouter } from "./routes/templates.js";
import { analyticsRouter } from "./routes/analytics.js";
import { contactsRouter } from "./routes/contacts.js";
import { countryLimitsRouter } from "./routes/countryLimits.js";
import { checkDatabaseConnection, cleanupOldDeliveryEvents, db, campaigns, contacts as dbContacts } from "./db/index.js";
import { seedDatabase } from "./db/seed.js";
import { extractCountryCode } from "./utils/phone.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

// Initialize database on startup
let dbReady = false;
(async () => {
  try {
    logger.info('🔌 Connecting to database...');
    const connected = await checkDatabaseConnection();
    if (!connected) {
      logger.error('❌ Database connection failed');
      return;
    }
    logger.info('✅ Database connected');

    // Seed default data
    await seedDatabase();

    // Run cleanup once on startup
    await cleanupOldDeliveryEvents();

    dbReady = true;
  } catch (error) {
    logger.error({ error }, '❌ Database initialization failed');
  }
})();

const SendSchema = z.object({
  limit: z.number().int().positive().max(100000).default(100),
  bodyText: z.string().min(1).default("Hello from our team!"),
  tag: z.string().optional(),
  dryRun: z.boolean().optional(),
  components: z.any().optional(),
  templateId: z.number().int().optional(),
});

app.post("/send", async (req, res) => {
  try {
    const parsed = SendSchema.parse(req.body ?? {});

    // Try to load contacts from database first, fallback to CSV
    let contacts: any[] = [];
    try {
      const dbContactsList = await db.select().from(dbContacts).where(eq(dbContacts.optIn, true));
      contacts = dbContactsList.map(c => ({
        phone: c.phone,
        opt_in: c.optIn,
        tags: c.tags,
      }));

      // If no contacts in database, fallback to CSV
      if (contacts.length === 0) {
        contacts = await loadContacts();
      }
    } catch {
      // Fallback to CSV if database fails
      contacts = await loadContacts();
    }

    // Apply tag filter
    if (parsed.tag) {
      contacts = contacts.filter(c => c.tags === parsed.tag);
    }

    // Create campaign record
    const [campaign] = await db.insert(campaigns).values({
      templateId: parsed.templateId,
      bodyText: parsed.bodyText,
      tag: parsed.tag,
      total: Math.min(contacts.length, parsed.limit),
      dryRun: parsed.dryRun || false,
    }).returning();

    // Send batch with campaign tracking
    const result = await sendBatch({
      contacts,
      limit: parsed.limit,
      bodyText: parsed.bodyText,
      dryRun: parsed.dryRun,
      components: parsed.components,
      templateId: parsed.templateId,
      tag: parsed.tag,
      campaignId: campaign.id,
    });

    // Update campaign with results
    await db.update(campaigns)
      .set({
        sent: result.sent,
        failed: result.total - result.sent,
      })
      .where(eq(campaigns.id, campaign.id));

    res.json({ ...result, campaignId: campaign.id });
  } catch (err: any) {
    req.log.error({ err }, "send_failed");
    res.status(400).json({ error: err?.message || String(err) });
  }
});

// Health + metrics
app.get("/health", async (_req, res) => {
  const health = await checkDatabaseConnection();
  res.json({ ok: true, database: dbReady && health });
});

// API Routes
app.use("/api/templates", templatesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/country-limits", countryLimitsRouter);

// Webhook routes
app.use(webhook);

app.listen(env.PORT, () => {
  logger.info(`Server listening on :${env.PORT}`);
});
