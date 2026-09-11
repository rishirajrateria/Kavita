CREATE TYPE "public"."analytics_dim" AS ENUM('site', 'path', 'country', 'region', 'city', 'device', 'os', 'browser', 'referrer', 'source', 'utm_campaign', 'screen', 'connection', 'event', 'funnel_step', 'geo_page');--> statement-breakpoint
ALTER TABLE "analytics_daily_rollup" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "analytics_daily_rollup_admin_all" ON "analytics_daily_rollup" CASCADE;--> statement-breakpoint
DROP TABLE "analytics_daily_rollup" CASCADE;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "client_key" text;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "time_on_page_ms" integer;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "scroll_depth_max" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "is_entry" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD COLUMN "is_exit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "client_sid" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "entry_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "exit_path" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "referrer_host" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "channel" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "os" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "browser" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "screen_w" integer;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "screen_h" integer;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "connection" text;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "is_bot" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "pageview_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_sessions" ADD COLUMN "duration_ms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "analytics_events_path_idx" ON "analytics_events" USING btree ("path","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_pageviews_occurred_idx" ON "analytics_pageviews" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_pageviews_session_key_uidx" ON "analytics_pageviews" USING btree ("session_id","client_key");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_sessions_visitor_sid_uidx" ON "analytics_sessions" USING btree ("visitor_hash","client_sid");