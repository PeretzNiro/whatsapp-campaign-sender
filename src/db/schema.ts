import { pgTable, serial, text, boolean, integer, timestamp, uuid, decimal, index } from 'drizzle-orm/pg-core';

// Templates table
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  language: text('language').notNull().default('en_US'),
  category: text('category').notNull().default('marketing'), // marketing, utility, authentication
  parameters: integer('parameters').notNull().default(0), // Number of {{1}}, {{2}} placeholders
  previewText: text('preview_text'),
  status: text('status').notNull().default('approved'), // approved, pending, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: integer('template_id').references(() => templates.id),
  bodyText: text('body_text'),
  tag: text('tag'),
  total: integer('total').notNull().default(0),
  sent: integer('sent').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  dryRun: boolean('dry_run').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('campaigns_created_at_idx').on(table.createdAt),
}));

// Delivery events table
export const deliveryEvents = pgTable('delivery_events', {
  id: serial('id').primaryKey(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  phone: text('phone').notNull(),
  messageId: text('message_id'),
  status: text('status').notNull(), // sent, delivered, read, failed
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  campaignIdIdx: index('delivery_events_campaign_id_idx').on(table.campaignId),
  phoneIdx: index('delivery_events_phone_idx').on(table.phone),
  timestampIdx: index('delivery_events_timestamp_idx').on(table.timestamp),
}));

// Country limits table
export const countryLimits = pgTable('country_limits', {
  id: serial('id').primaryKey(),
  countryCode: text('country_code').notNull().unique(), // +1, +972, etc.
  countryName: text('country_name'),
  maxPerSecond: integer('max_per_second').notNull().default(50),
  maxConcurrency: integer('max_concurrency').notNull().default(10),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts archive (for CSV upload history)
export const contactsArchive = pgTable('contacts_archive', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  totalContacts: integer('total_contacts').notNull(),
  optedIn: integer('opted_in').notNull(),
  uploadedBy: text('uploaded_by').default('admin'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Enhanced contacts table (migrating from CSV)
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  optIn: boolean('opt_in').notNull().default(false),
  tags: text('tags'),
  countryCode: text('country_code'), // Extracted from phone
  firstName: text('first_name'),
  lastName: text('last_name'),
  lastContactedAt: timestamp('last_contacted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index('contacts_phone_idx').on(table.phone),
  optInIdx: index('contacts_opt_in_idx').on(table.optIn),
  tagsIdx: index('contacts_tags_idx').on(table.tags),
}));

// Type exports for TypeScript
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type NewDeliveryEvent = typeof deliveryEvents.$inferInsert;

export type CountryLimit = typeof countryLimits.$inferSelect;
export type NewCountryLimit = typeof countryLimits.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type ContactsArchive = typeof contactsArchive.$inferSelect;
export type NewContactsArchive = typeof contactsArchive.$inferInsert;
