CREATE TABLE "faq_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faq_id" uuid NOT NULL,
	"route_pattern" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faq_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "og_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"label" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" integer NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "og_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route" text NOT NULL,
	"h2_id" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"key_facts" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "robots_bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent" text NOT NULL,
	"allow" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "robots_bots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"config" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "h1_override" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "robots" jsonb;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "og_title" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "og_description" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "og_type" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "og_text" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "twitter_card" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "twitter_title" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "twitter_description" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "twitter_image_url" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "keyword_focus" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "custom_head_html" text;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "hreflang" jsonb;--> statement-breakpoint
ALTER TABLE "page_seo" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "faq_attachments" ADD CONSTRAINT "faq_attachments_faq_id_faqs_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_documents" ADD CONSTRAINT "site_documents_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "faq_attachments_faq_route_uidx" ON "faq_attachments" USING btree ("faq_id","route_pattern");--> statement-breakpoint
CREATE INDEX "faq_attachments_route_idx" ON "faq_attachments" USING btree ("route_pattern","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "og_images_path_uidx" ON "og_images" USING btree ("storage_path");--> statement-breakpoint
CREATE UNIQUE INDEX "page_answers_route_h2_uidx" ON "page_answers" USING btree ("route","h2_id");--> statement-breakpoint
CREATE UNIQUE INDEX "robots_bots_agent_uidx" ON "robots_bots" USING btree ("agent");--> statement-breakpoint
CREATE UNIQUE INDEX "site_documents_key_uidx" ON "site_documents" USING btree ("key");--> statement-breakpoint
CREATE POLICY "faq_attachments_public_select" ON "faq_attachments" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("faq_attachments"."is_published" = true);--> statement-breakpoint
CREATE POLICY "faq_attachments_admin_all" ON "faq_attachments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "og_images_public_select" ON "og_images" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "og_images_admin_all" ON "og_images" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "page_answers_public_select" ON "page_answers" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "page_answers_admin_all" ON "page_answers" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "robots_bots_public_select" ON "robots_bots" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "robots_bots_admin_all" ON "robots_bots" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "site_documents_public_select" ON "site_documents" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "site_documents_admin_all" ON "site_documents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
-- Hand-written additions: updated_at triggers for the new tables and policy documentation.
drop trigger if exists set_updated_at on public.faq_attachments;--> statement-breakpoint
create trigger set_updated_at before update on public.faq_attachments for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.og_images;--> statement-breakpoint
create trigger set_updated_at before update on public.og_images for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.page_answers;--> statement-breakpoint
create trigger set_updated_at before update on public.page_answers for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.robots_bots;--> statement-breakpoint
create trigger set_updated_at before update on public.robots_bots for each row execute function public.set_updated_at();--> statement-breakpoint
drop trigger if exists set_updated_at on public.site_documents;--> statement-breakpoint
create trigger set_updated_at before update on public.site_documents for each row execute function public.set_updated_at();--> statement-breakpoint
comment on policy "faq_attachments_public_select" on public.faq_attachments is 'Anyone may read published attachments: they decide which FAQs render on which public routes.';--> statement-breakpoint
comment on policy "page_answers_public_select" on public.page_answers is 'Anyone may read answer-block and key-facts overrides: they are rendered into public pages.';--> statement-breakpoint
comment on policy "site_documents_public_select" on public.site_documents is 'Anyone may read: llms.txt, /for-ai and OG template configuration hold nothing sensitive.';--> statement-breakpoint
comment on policy "robots_bots_public_select" on public.robots_bots is 'Anyone may read: robots.txt is rendered from these rows.';--> statement-breakpoint
comment on policy "og_images_public_select" on public.og_images is 'Anyone may read: the library lists public social-preview images.';
