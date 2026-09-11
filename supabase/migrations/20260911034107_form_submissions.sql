CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"source_path" text,
	"region" text,
	"is_handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "testimonial_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"testimonial_id" uuid NOT NULL,
	"email" text NOT NULL,
	"location_text" text NOT NULL,
	"region" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testimonial_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "testimonial_submissions" ADD CONSTRAINT "testimonial_submissions_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_messages_handled_idx" ON "contact_messages" USING btree ("is_handled","created_at");--> statement-breakpoint
CREATE INDEX "testimonial_submissions_testimonial_idx" ON "testimonial_submissions" USING btree ("testimonial_id");--> statement-breakpoint
CREATE POLICY "contact_messages_admin_all" ON "contact_messages" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "testimonial_submissions_admin_all" ON "testimonial_submissions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers (the Phase 1 trigger migration only attached to
-- tables that existed then) and the policy documentation convention.
drop trigger if exists set_updated_at on public.contact_messages;--> statement-breakpoint
create trigger set_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.testimonial_submissions;--> statement-breakpoint
create trigger set_updated_at before update on public.testimonial_submissions for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "contact_messages_admin_all" on public.contact_messages is 'Personal data: admin-only. POST /api/contact writes with the service role; visitors can never read messages back.';--> statement-breakpoint
comment on policy "testimonial_submissions_admin_all" on public.testimonial_submissions is 'Submitter email and location text: admin-only, kept apart from the public-readable testimonials row.';
