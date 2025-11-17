import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/whatsapp_sender"),
  WHATSAPP_TOKEN: z.string().min(10),
  PHONE_NUMBER_ID: z.string().min(5),
  BUSINESS_ACCOUNT_ID: z.string().optional(),
  WEBHOOK_VERIFY_TOKEN: z.string().min(3),
  SEND_MAX_PER_SECOND: z.coerce.number().default(80),
  SEND_CONCURRENCY: z.coerce.number().default(15),
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3),
  RETRY_BASE_MS: z.coerce.number().default(1000),
  CONTACTS_CSV: z.string().default("./contacts.csv"), // Legacy CSV support
});

export const env = EnvSchema.parse(process.env);
