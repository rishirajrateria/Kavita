CREATE TABLE "capi_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'meta_capi' NOT NULL,
	"internal_event" text NOT NULL,
	"provider_event" text NOT NULL,
	"event_id" text NOT NULL,
	"status" text NOT NULL,
	"http_status" integer,
	"request" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response" jsonb,
	"test_event_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capi_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_version" text DEFAULT '2026-09' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"accept_label" text DEFAULT 'Accept' NOT NULL,
	"reject_label" text DEFAULT 'Reject' NOT NULL,
	"consent_regions" text[] DEFAULT '{}' NOT NULL,
	"unknown_region_requires_consent" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"internal_event" text NOT NULL,
	"provider_event" text NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_mappings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "last_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "last_test_status" text;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "last_test_message" text;--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE INDEX "capi_log_created_idx" ON "capi_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "capi_log_event_idx" ON "capi_log" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_config_singleton_uidx" ON "consent_config" USING btree ((true));--> statement-breakpoint
CREATE UNIQUE INDEX "event_mappings_provider_event_uidx" ON "event_mappings" USING btree ("provider","internal_event");--> statement-breakpoint
CREATE POLICY "capi_log_admin_all" ON "capi_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "consent_config_admin_all" ON "consent_config" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "event_mappings_admin_all" ON "event_mappings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.capi_log;--> statement-breakpoint
create trigger set_updated_at before update on public.capi_log for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.consent_config;--> statement-breakpoint
create trigger set_updated_at before update on public.consent_config for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.event_mappings;--> statement-breakpoint
create trigger set_updated_at before update on public.event_mappings for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "capi_log_admin_all" on public.capi_log is 'Admin-only, redacted log of server-side Conversions API sends; written with the service role.';--> statement-breakpoint
comment on policy "consent_config_admin_all" on public.consent_config is 'Admin-only single row; the consent banner is server-rendered from it.';--> statement-breakpoint
comment on policy "event_mappings_admin_all" on public.event_mappings is 'Admin-only; read server-side to build the browser fan-out and CAPI event names.';
