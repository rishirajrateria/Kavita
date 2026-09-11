CREATE TYPE "public"."seo_crawl_status" AS ENUM('running', 'paused', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."seo_crawl_trigger" AS ENUM('manual', 'cron');--> statement-breakpoint
CREATE TYPE "public"."seo_finding_severity" AS ENUM('error', 'warning', 'info');--> statement-breakpoint
CREATE TABLE "seo_crawls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "seo_crawl_status" DEFAULT 'running' NOT NULL,
	"trigger" "seo_crawl_trigger" DEFAULT 'manual' NOT NULL,
	"origin" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"elapsed_ms" integer DEFAULT 0 NOT NULL,
	"pages_crawled" integer DEFAULT 0 NOT NULL,
	"pages_discovered" integer DEFAULT 0 NOT NULL,
	"state" jsonb,
	"summary" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_crawls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seo_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crawl_id" uuid NOT NULL,
	"path" text NOT NULL,
	"type" text NOT NULL,
	"severity" "seo_finding_severity" DEFAULT 'warning' NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"fix_href" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_findings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_findings" ADD CONSTRAINT "seo_findings_crawl_id_seo_crawls_id_fk" FOREIGN KEY ("crawl_id") REFERENCES "public"."seo_crawls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seo_crawls_started_idx" ON "seo_crawls" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "seo_findings_crawl_idx" ON "seo_findings" USING btree ("crawl_id","severity");--> statement-breakpoint
CREATE INDEX "seo_findings_type_idx" ON "seo_findings" USING btree ("crawl_id","type");--> statement-breakpoint
CREATE INDEX "seo_findings_path_idx" ON "seo_findings" USING btree ("crawl_id","path");--> statement-breakpoint
CREATE POLICY "seo_crawls_admin_all" ON "seo_crawls" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "seo_findings_admin_all" ON "seo_findings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.seo_crawls;--> statement-breakpoint
create trigger set_updated_at before update on public.seo_crawls for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.seo_findings;--> statement-breakpoint
create trigger set_updated_at before update on public.seo_findings for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "seo_crawls_admin_all" on public.seo_crawls is 'Admin-only. One row per SEO health crawl run (manual or weekly cron) with its resumable cursor and summary.';--> statement-breakpoint
comment on policy "seo_findings_admin_all" on public.seo_findings is 'Admin-only. One row per SEO finding of a crawl, each linking to the admin editor that fixes it.';
