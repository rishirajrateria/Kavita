CREATE TYPE "public"."currency" AS ENUM('INR', 'USD', 'GBP', 'AED');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."booking_mode" AS ENUM('online_video', 'online_phone', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'awaiting_payment', 'paid', 'payment_pending_offline', 'rescheduled', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'authorized', 'captured', 'refunded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."testimonial_source" AS ENUM('website_form', 'email', 'whatsapp', 'google', 'other');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('country', 'state', 'city');--> statement-breakpoint
CREATE TYPE "public"."population_tier" AS ENUM('mega', 'large', 'medium', 'small');--> statement-breakpoint
CREATE TYPE "public"."research_status" AS ENUM('complete', 'partial', 'stub');--> statement-breakpoint
CREATE TYPE "public"."service_lead" AS ENUM('astrology', 'vastu', 'integrated');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('google_search_console', 'bing_webmaster', 'meta_pixel', 'meta_capi', 'google_tag', 'google_ads', 'ga4', 'linkedin_insight', 'pinterest_tag', 'tiktok_pixel', 'microsoft_uet', 'gtm', 'custom_head', 'custom_body');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('instagram', 'youtube', 'facebook', 'linkedin', 'x', 'whatsapp', 'telegram', 'pinterest', 'threads', 'google_business', 'other');--> statement-breakpoint
CREATE TYPE "public"."verification_kind" AS ENUM('meta', 'file');--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"diff" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics_daily_rollup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"path" text NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"events" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_daily_rollup" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"event_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics_pageviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_hash" text NOT NULL,
	"first_path" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"region" text,
	"device_type" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_blocked" boolean DEFAULT true NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_exceptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"service_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"changed_by" text NOT NULL,
	"admin_user_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"location_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"client_timezone" text NOT NULL,
	"mode" "booking_mode" NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"client_notes" text,
	"manage_token" text NOT NULL,
	"rescheduled_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"timezone" text NOT NULL,
	"preferred_language" text,
	"birth_details_encrypted" "bytea",
	"birth_details_key_id" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"amount_minor" integer NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"idempotency_key" text NOT NULL,
	"provider_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "article_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"primary_question" text NOT NULL,
	"excerpt" text NOT NULL,
	"body_md" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"content_updated_at" timestamp with time zone,
	"reading_time_minutes" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_pattern" text,
	"location_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"term" text NOT NULL,
	"transliteration" text,
	"short_definition" text NOT NULL,
	"body_md" text NOT NULL,
	"related_slugs" text[] DEFAULT '{}' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"content_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "glossary_terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" text NOT NULL,
	"client_location_id" uuid,
	"service_id" uuid,
	"quote" text NOT NULL,
	"rating" smallint,
	"date" date,
	"source" "testimonial_source" DEFAULT 'website_form' NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"type" "location_type" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"path" text NOT NULL,
	"iso_country" text NOT NULL,
	"iso_region" text,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"timezone" text NOT NULL,
	"population_tier" "population_tier",
	"languages" text[] DEFAULT '{}' NOT NULL,
	"currency" "currency" NOT NULL,
	"research_status" "research_status" DEFAULT 'stub' NOT NULL,
	"landmarks" jsonb,
	"tradition" jsonb,
	"climate_architecture" jsonb,
	"client_concerns" jsonb,
	"faqs" jsonb,
	"consultation_window" jsonb,
	"body_astrology_md" text,
	"body_vastu_md" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"content_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_seo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route" text NOT NULL,
	"title" text,
	"meta_description" text,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"nofollow" boolean DEFAULT false NOT NULL,
	"og_image_url" text,
	"structured_data_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_seo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "redirects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "service_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"lead" "service_lead" NOT NULL,
	"duration_minutes" integer NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"price_minor" integer,
	"currency" "currency",
	"prices" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_note" text,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"what_to_prepare" text[] DEFAULT '{}' NOT NULL,
	"what_you_receive" text[] DEFAULT '{}' NOT NULL,
	"delivery_modes" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"region" text,
	"choices" jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"loads_in_regions" text[] DEFAULT '{}' NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" text NOT NULL,
	"legal_entity" text NOT NULL,
	"practitioner_name" text NOT NULL,
	"tagline" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"address_postal_code" text,
	"address_region" text,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"timezone" text NOT NULL,
	"default_currency" "currency" DEFAULT 'INR' NOT NULL,
	"business_hours" jsonb NOT NULL,
	"in_person_available" boolean DEFAULT false NOT NULL,
	"response_time_hours" integer DEFAULT 24 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "social_platform" NOT NULL,
	"url" text NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"show_in_footer" boolean DEFAULT true NOT NULL,
	"show_in_header" boolean DEFAULT false NOT NULL,
	"include_in_sameas" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verification_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"kind" "verification_kind" NOT NULL,
	"meta_name" text,
	"meta_content" text,
	"file_path" text,
	"file_content" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_analytics_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_pageviews" ADD CONSTRAINT "analytics_pageviews_session_id_analytics_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_client_location_id_locations_id_fk" FOREIGN KEY ("client_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_translations" ADD CONSTRAINT "service_translations_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_log_entity_idx" ON "admin_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_auth_user_uidx" ON "admin_users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uidx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_daily_rollup_day_path_uidx" ON "analytics_daily_rollup" USING btree ("day","path");--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("name","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_events_event_id_uidx" ON "analytics_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "analytics_pageviews_path_idx" ON "analytics_pageviews" USING btree ("path","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_pageviews_session_idx" ON "analytics_pageviews" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_sessions_visitor_idx" ON "analytics_sessions" USING btree ("visitor_hash","started_at");--> statement-breakpoint
CREATE INDEX "analytics_sessions_started_idx" ON "analytics_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "availability_exceptions_range_idx" ON "availability_exceptions" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "availability_rules_weekday_idx" ON "availability_rules" USING btree ("weekday","is_active");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_idx" ON "booking_status_history" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_slot_uidx" ON "bookings" USING btree ("starts_at") WHERE status in ('pending', 'confirmed', 'awaiting_payment', 'paid', 'payment_pending_offline');--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_manage_token_uidx" ON "bookings" USING btree ("manage_token");--> statement-breakpoint
CREATE INDEX "bookings_client_idx" ON "bookings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "bookings_status_starts_idx" ON "bookings" USING btree ("status","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_email_uidx" ON "clients" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_uidx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_provider_ref_idx" ON "payments" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "article_categories_slug_uidx" ON "article_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_category_slug_uidx" ON "articles" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "articles_status_published_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "faqs_route_idx" ON "faqs" USING btree ("route_pattern","sort_order");--> statement-breakpoint
CREATE INDEX "faqs_location_idx" ON "faqs" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_terms_slug_uidx" ON "glossary_terms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "testimonials_published_idx" ON "testimonials" USING btree ("is_published","consent_given");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_path_uidx" ON "locations" USING btree ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_parent_slug_uidx" ON "locations" USING btree ("parent_id","slug");--> statement-breakpoint
CREATE INDEX "locations_type_idx" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "locations_iso_country_idx" ON "locations" USING btree ("iso_country");--> statement-breakpoint
CREATE INDEX "locations_featured_idx" ON "locations" USING btree ("is_featured","type");--> statement-breakpoint
CREATE UNIQUE INDEX "page_seo_route_uidx" ON "page_seo" USING btree ("route");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_from_path_uidx" ON "redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "redirects_active_idx" ON "redirects" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "service_translations_service_locale_uidx" ON "service_translations" USING btree ("service_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_uidx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_sort_idx" ON "services" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "consent_log_visitor_idx" ON "consent_log" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_provider_uidx" ON "integrations" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_singleton_uidx" ON "site_settings" USING btree ((true));--> statement-breakpoint
CREATE UNIQUE INDEX "social_links_url_uidx" ON "social_links" USING btree ("url");--> statement-breakpoint
CREATE INDEX "social_links_sort_idx" ON "social_links" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tags_provider_kind_uidx" ON "verification_tags" USING btree ("provider","kind");--> statement-breakpoint
CREATE POLICY "admin_audit_log_admin_all" ON "admin_audit_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "admin_users_admin_all" ON "admin_users" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "analytics_daily_rollup_admin_all" ON "analytics_daily_rollup" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "analytics_events_admin_all" ON "analytics_events" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "analytics_pageviews_admin_all" ON "analytics_pageviews" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "analytics_sessions_admin_all" ON "analytics_sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "availability_exceptions_admin_all" ON "availability_exceptions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "availability_rules_admin_all" ON "availability_rules" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "booking_status_history_admin_all" ON "booking_status_history" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "bookings_admin_all" ON "bookings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "clients_admin_all" ON "clients" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "payments_admin_all" ON "payments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "article_categories_public_select" ON "article_categories" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "article_categories_admin_all" ON "article_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "articles_public_select" ON "articles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("articles"."status" = 'published');--> statement-breakpoint
CREATE POLICY "articles_admin_all" ON "articles" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "faqs_public_select" ON "faqs" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("faqs"."is_published" = true);--> statement-breakpoint
CREATE POLICY "faqs_admin_all" ON "faqs" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "glossary_terms_public_select" ON "glossary_terms" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("glossary_terms"."status" = 'published');--> statement-breakpoint
CREATE POLICY "glossary_terms_admin_all" ON "glossary_terms" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "testimonials_public_select" ON "testimonials" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("testimonials"."is_published" = true and "testimonials"."consent_given" = true);--> statement-breakpoint
CREATE POLICY "testimonials_public_insert" ON "testimonials" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK ("testimonials"."is_published" = false and "testimonials"."is_placeholder" = false and ("testimonials"."rating" is null or "testimonials"."rating" between 1 and 5));--> statement-breakpoint
CREATE POLICY "testimonials_admin_all" ON "testimonials" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "locations_public_select" ON "locations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "locations_admin_all" ON "locations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "page_seo_public_select" ON "page_seo" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "page_seo_admin_all" ON "page_seo" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "redirects_admin_all" ON "redirects" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "service_translations_public_select" ON "service_translations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "service_translations_admin_all" ON "service_translations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "services_public_select" ON "services" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("services"."is_active" = true);--> statement-breakpoint
CREATE POLICY "services_admin_all" ON "services" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "consent_log_public_insert" ON "consent_log" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "consent_log_admin_all" ON "consent_log" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "integrations_admin_all" ON "integrations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "site_settings_public_select" ON "site_settings" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "site_settings_admin_all" ON "site_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "social_links_public_select" ON "social_links" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("social_links"."is_visible" = true);--> statement-breakpoint
CREATE POLICY "social_links_admin_all" ON "social_links" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));--> statement-breakpoint
CREATE POLICY "verification_tags_admin_all" ON "verification_tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));