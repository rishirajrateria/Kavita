DROP INDEX "locations_iso_country_idx";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "iso_country";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "iso_region";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "landmarks";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "tradition";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "climate_architecture";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "client_concerns";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "faqs";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "consultation_window";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "body_astrology_md";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "body_vastu_md";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "is_published";