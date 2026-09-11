-- Phase 2: align `locations` with src/content/locations/schema.ts (LocationBase + research JSONB).
-- Hand-adjusted from drizzle-kit output so it is safe on a database that already holds the
-- Phase 1 seed rows: new NOT NULL columns are added nullable, backfilled from the legacy
-- columns, then constrained. The follow-up migration drops the legacy columns.
CREATE TYPE "public"."hreflang" AS ENUM('en-IN', 'en-US', 'en-GB', 'en-AE', 'en-CA', 'en-AU', 'en-SG');--> statement-breakpoint
CREATE TYPE "public"."location_currency" AS ENUM('INR', 'USD', 'GBP', 'AED', 'CAD', 'AUD', 'SGD');--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "short_name" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "region_code" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "hreflang" "hreflang";--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "research" jsonb;--> statement-breakpoint
UPDATE "locations" SET "country_code" = "iso_country" WHERE "country_code" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "region_code" = "iso_region" WHERE "region_code" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "population_tier" = 'large' WHERE "population_tier" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "content_updated_at" = coalesce("content_updated_at", "updated_at");--> statement-breakpoint
DELETE FROM "locations" WHERE "lat" IS NULL OR "lng" IS NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "country_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "iso_country" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "lat" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "lng" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "population_tier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "currency" SET DATA TYPE "public"."location_currency" USING "currency"::text::"public"."location_currency";--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "content_updated_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "content_updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "locations_country_code_idx" ON "locations" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "locations_research_status_idx" ON "locations" USING btree ("research_status","type");
