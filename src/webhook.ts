import { Router } from "express";
import type { Request, Response } from "express";
import { env } from "./env.js";
import { optOut } from "./contacts.js";
import { db, deliveryEvents, contacts } from "./db/index.js";
import { eq } from "drizzle-orm";

export const webhook = Router();

// Verify webhook
webhook.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"]; // subscribe
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === env.WEBHOOK_VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

// Receive events
webhook.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const entries = payload?.entry ?? [];

    for (const e of entries) {
      const changes = e?.changes ?? [];
      for (const ch of changes) {
        const value = ch?.value;

        // Handle message status updates (delivered, read, failed)
        const statuses = value?.statuses ?? [];
        for (const status of statuses) {
          const recipientId = status?.recipient_id; // Phone number without +
          const messageId = status?.id;
          const statusType = status?.status; // sent, delivered, read, failed
          const timestamp = status?.timestamp;

          if (recipientId && messageId && statusType) {
            const phone = recipientId.startsWith('+') ? recipientId : `+${recipientId}`;

            try {
              // Find existing event by message_id and update status
              const existingEvents = await db.select()
                .from(deliveryEvents)
                .where(eq(deliveryEvents.messageId, messageId));

              if (existingEvents.length > 0) {
                // Update existing event
                await db.update(deliveryEvents)
                  .set({ status: statusType, timestamp: new Date(parseInt(timestamp) * 1000) })
                  .where(eq(deliveryEvents.messageId, messageId));
              } else {
                // Create new event if not found
                await db.insert(deliveryEvents).values({
                  phone,
                  messageId,
                  status: statusType,
                  timestamp: new Date(parseInt(timestamp) * 1000),
                });
              }
            } catch (error) {
              console.error('Failed to store delivery status:', error);
            }
          }
        }

        // Handle inbound messages
        const messages = value?.messages ?? [];
        for (const m of messages) {
          const from = m?.from ? `+${m.from}`.replace(/^\+?/, "+") : undefined;
          const text = m?.text?.body?.trim()?.toUpperCase();
          const messageId = m?.id;

          if (from && text === "STOP") {
            // Opt-out from CSV (legacy support)
            await optOut(from);

            // Opt-out from database
            try {
              await db.update(contacts)
                .set({ optIn: false, updatedAt: new Date() })
                .where(eq(contacts.phone, from));
            } catch (error) {
              console.error('Failed to opt-out contact from database:', error);
            }
          }

          // Store inbound message event
          if (from && messageId) {
            try {
              await db.insert(deliveryEvents).values({
                phone: from,
                messageId,
                status: 'received',
                errorMessage: text ? `Inbound: ${text.substring(0, 100)}` : undefined,
              });
            } catch (error) {
              console.error('Failed to store inbound message:', error);
            }
          }
        }

        // Handle message errors
        const errors = value?.errors ?? [];
        for (const error of errors) {
          const errorCode = error?.code;
          const errorMessage = error?.title || error?.message;
          const errorDetails = JSON.stringify(error);

          console.error('WhatsApp webhook error:', { errorCode, errorMessage, errorDetails });
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  // Always return 200 to acknowledge receipt
  res.sendStatus(200);
});
