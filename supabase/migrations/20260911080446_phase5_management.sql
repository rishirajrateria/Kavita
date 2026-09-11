CREATE TABLE "booking_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"admin_user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_flags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"recipient" text DEFAULT 'client' NOT NULL,
	"subject" text,
	"intro" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_notes_booking_idx" ON "booking_notes" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_key_uidx" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_templates_kind_recipient_uidx" ON "notification_templates" USING btree ("kind","recipient");--> statement-breakpoint
CREATE POLICY "booking_notes_admin_all" ON "booking_notes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "feature_flags_admin_all" ON "feature_flags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "notification_templates_admin_all" ON "notification_templates" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.feature_flags;--> statement-breakpoint
create trigger set_updated_at before update on public.feature_flags for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.booking_notes;--> statement-breakpoint
create trigger set_updated_at before update on public.booking_notes for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.notification_templates;--> statement-breakpoint
create trigger set_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "feature_flags_admin_all" on public.feature_flags is 'Admin-only. Runtime flags (PAYMENTS_ENABLED, WHATSAPP_NOTIFICATIONS_ENABLED, FEATURE_SOCIAL_WIDGETS); the environment variable of the same name is the fallback when no row exists.';--> statement-breakpoint
comment on policy "booking_notes_admin_all" on public.booking_notes is 'Admin-only. Internal notes on a booking: never shown to the client, never emailed, treated as personal data.';--> statement-breakpoint
comment on policy "notification_templates_admin_all" on public.notification_templates is 'Admin-only. Subject/intro overrides per (kind, recipient); the React Email templates remain the body.';
