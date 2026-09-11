CREATE TYPE "public"."notification_channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('confirmation_client', 'confirmation_practitioner', 'reminder_24h', 'reminder_1h', 'reschedule', 'cancellation');--> statement-breakpoint
CREATE TABLE "floor_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"storage_path" text NOT NULL,
	"content_type" text NOT NULL,
	"bytes" integer NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "floor_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"dedupe_key" text NOT NULL,
	"sent_at" timestamp with time zone,
	"provider_ref" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "lead_time_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "horizon_days" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "reschedule_notice_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "slot_step_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "floor_plans_storage_path_uidx" ON "floor_plans" USING btree ("storage_path");--> statement-breakpoint
CREATE INDEX "floor_plans_booking_idx" ON "floor_plans" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_log_dedupe_key_uidx" ON "notification_log" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notification_log_booking_idx" ON "notification_log" USING btree ("booking_id","kind");--> statement-breakpoint
CREATE POLICY "floor_plans_admin_all" ON "floor_plans" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "notification_log_admin_all" ON "notification_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.notification_log;--> statement-breakpoint
create trigger set_updated_at before update on public.notification_log for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.floor_plans;--> statement-breakpoint
create trigger set_updated_at before update on public.floor_plans for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "notification_log_admin_all" on public.notification_log is 'Admin-only. notify() writes with the service role; dedupe_key = booking:kind:channel makes every send idempotent.';--> statement-breakpoint
comment on policy "floor_plans_admin_all" on public.floor_plans is 'Personal data (a client home layout in the private floor-plans bucket): admin-only; uploads go through POST /api/uploads/floor-plan with the service role.';--> statement-breakpoint
comment on column public.site_settings.lead_time_hours is 'Booking engine: earliest bookable slot is this many hours from now.';--> statement-breakpoint
comment on column public.site_settings.horizon_days is 'Booking engine: latest bookable slot is this many days from now.';--> statement-breakpoint
comment on column public.site_settings.reschedule_notice_hours is 'Booking engine: clients may self-reschedule only while the session is at least this many hours away.';--> statement-breakpoint
comment on column public.site_settings.slot_step_minutes is 'Booking engine: slot start times are offered every N minutes inside an availability window.';
