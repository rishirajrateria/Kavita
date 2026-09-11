CREATE TYPE "public"."redirect_match_type" AS ENUM('exact', 'wildcard', 'regex');--> statement-breakpoint
CREATE TYPE "public"."redirect_source" AS ENUM('manual', 'slug_change', 'not_found_fix', 'import');--> statement-breakpoint
CREATE TABLE "indexnow_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urls" jsonb NOT NULL,
	"status" text NOT NULL,
	"response" text,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "indexnow_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "not_found_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_referrer" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "not_found_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "search_performance_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"cache_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_performance_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sitemap_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" text NOT NULL,
	"included" boolean DEFAULT true NOT NULL,
	"per_page" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sitemap_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "redirects" ADD COLUMN "match_type" "redirect_match_type" DEFAULT 'exact' NOT NULL;--> statement-breakpoint
ALTER TABLE "redirects" ADD COLUMN "source" "redirect_source" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE INDEX "indexnow_log_created_idx" ON "indexnow_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "not_found_log_path_uidx" ON "not_found_log" USING btree ("path");--> statement-breakpoint
CREATE INDEX "not_found_log_hits_idx" ON "not_found_log" USING btree ("hits");--> statement-breakpoint
CREATE UNIQUE INDEX "search_performance_cache_key_uidx" ON "search_performance_cache" USING btree ("provider","cache_key");--> statement-breakpoint
CREATE UNIQUE INDEX "sitemap_config_section_uidx" ON "sitemap_config" USING btree ("section");--> statement-breakpoint
CREATE POLICY "indexnow_log_admin_all" ON "indexnow_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "not_found_log_admin_all" ON "not_found_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "search_performance_cache_admin_all" ON "search_performance_cache" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "sitemap_config_admin_all" ON "sitemap_config" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.not_found_log;--> statement-breakpoint
create trigger set_updated_at before update on public.not_found_log for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.sitemap_config;--> statement-breakpoint
create trigger set_updated_at before update on public.sitemap_config for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.indexnow_log;--> statement-breakpoint
create trigger set_updated_at before update on public.indexnow_log for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.search_performance_cache;--> statement-breakpoint
create trigger set_updated_at before update on public.search_performance_cache for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "not_found_log_admin_all" on public.not_found_log is 'Admin-only. Rows are written by the server (service role) from not-found renders.';--> statement-breakpoint
comment on policy "sitemap_config_admin_all" on public.sitemap_config is 'Admin-only. Read server-side by the sitemap generators with the service role.';--> statement-breakpoint
comment on policy "indexnow_log_admin_all" on public.indexnow_log is 'Admin-only log of IndexNow submissions.';--> statement-breakpoint
comment on policy "search_performance_cache_admin_all" on public.search_performance_cache is 'Admin-only 1 h cache of Search Console / Bing Webmaster responses.';
