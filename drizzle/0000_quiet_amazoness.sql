CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" integer,
	"body_text" text,
	"tag" text,
	"total" integer DEFAULT 0 NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"dry_run" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"opt_in" boolean DEFAULT false NOT NULL,
	"tags" text,
	"country_code" text,
	"first_name" text,
	"last_name" text,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "contacts_archive" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"total_contacts" integer NOT NULL,
	"opted_in" integer NOT NULL,
	"uploaded_by" text DEFAULT 'admin',
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"country_name" text,
	"max_per_second" integer DEFAULT 50 NOT NULL,
	"max_concurrency" integer DEFAULT 10 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "country_limits_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE "delivery_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" uuid,
	"phone" text NOT NULL,
	"message_id" text,
	"status" text NOT NULL,
	"error_message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'en_US' NOT NULL,
	"category" text DEFAULT 'marketing' NOT NULL,
	"parameters" integer DEFAULT 0 NOT NULL,
	"preview_text" text,
	"status" text DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_opt_in_idx" ON "contacts" USING btree ("opt_in");--> statement-breakpoint
CREATE INDEX "contacts_tags_idx" ON "contacts" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "delivery_events_campaign_id_idx" ON "delivery_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "delivery_events_phone_idx" ON "delivery_events" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "delivery_events_timestamp_idx" ON "delivery_events" USING btree ("timestamp");