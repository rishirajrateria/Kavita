-- Attach the updated_at trigger to every public table that has an updated_at column, and
-- document every RLS policy created by the generated schema migration. Idempotent.

do $$
declare
  t record;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and tb.table_type = 'BASE TABLE'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t.table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t.table_name
    );
  end loop;
end
$$;

-- Policy documentation. "admin" = authenticated user with an active admin_users row
-- (public.is_admin()). service_role bypasses RLS and needs no policy.

-- Public content tables --------------------------------------------------------------------
comment on policy "site_settings_public_select" on public.site_settings is 'Anyone may read the single settings row (NAP, hours, timezone) that the footer, contact page and schema read from.';
comment on policy "site_settings_admin_all" on public.site_settings is 'Admins may edit site settings.';
comment on policy "social_links_public_select" on public.social_links is 'Anyone may read visible social links; hidden links remain admin-only.';
comment on policy "social_links_admin_all" on public.social_links is 'Admins manage social links.';
comment on policy "services_public_select" on public.services is 'Anyone may read active services; inactive drafts are admin-only.';
comment on policy "services_admin_all" on public.services is 'Admins manage services.';
comment on policy "service_translations_public_select" on public.service_translations is 'Translations are public; join to services applies the is_active gate.';
comment on policy "service_translations_admin_all" on public.service_translations is 'Admins manage translations.';
comment on policy "locations_public_select" on public.locations is 'The location tree is public (no personal data); the Phase 2 gate decides which render.';
comment on policy "locations_admin_all" on public.locations is 'Admins manage locations and their research fields.';
comment on policy "faqs_public_select" on public.faqs is 'Anyone may read published FAQs.';
comment on policy "faqs_admin_all" on public.faqs is 'Admins manage FAQs.';
comment on policy "article_categories_public_select" on public.article_categories is 'Category hubs are public.';
comment on policy "article_categories_admin_all" on public.article_categories is 'Admins manage categories.';
comment on policy "articles_public_select" on public.articles is 'Anyone may read published articles; drafts/archived are admin-only.';
comment on policy "articles_admin_all" on public.articles is 'Admins manage articles.';
comment on policy "glossary_terms_public_select" on public.glossary_terms is 'Anyone may read published glossary terms.';
comment on policy "glossary_terms_admin_all" on public.glossary_terms is 'Admins manage glossary terms.';
comment on policy "page_seo_public_select" on public.page_seo is 'Per-route SEO overrides hold nothing sensitive and are public read.';
comment on policy "page_seo_admin_all" on public.page_seo is 'Admins manage SEO overrides.';
comment on policy "testimonials_public_select" on public.testimonials is 'Anyone may read testimonials that are both published AND consented (CLAUDE.md §12).';
comment on policy "testimonials_public_insert" on public.testimonials is 'Visitors may submit a testimonial only as unpublished, non-placeholder, with a null or 1-5 rating.';
comment on policy "testimonials_admin_all" on public.testimonials is 'Admins review, publish and delete testimonials.';
comment on policy "consent_log_public_insert" on public.consent_log is 'Visitors may record their consent choice; they can never read the log.';
comment on policy "consent_log_admin_all" on public.consent_log is 'Admins may read the consent log for compliance.';

-- Sensitive tables: anon has no access of any kind -------------------------------------------
comment on policy "integrations_admin_all" on public.integrations is 'Holds credentials: admin-only. The <Integrations /> server component reads via the service role.';
comment on policy "verification_tags_admin_all" on public.verification_tags is 'Admin-only; rendered server-side.';
comment on policy "redirects_admin_all" on public.redirects is 'Admin-only; middleware resolves redirects via the service role.';
comment on policy "availability_rules_admin_all" on public.availability_rules is 'Admin-only; visitors see only computed free slots.';
comment on policy "availability_exceptions_admin_all" on public.availability_exceptions is 'Admin-only.';
comment on policy "clients_admin_all" on public.clients is 'Personal data: admin-only. Bookings are created server-side with the service role.';
comment on policy "bookings_admin_all" on public.bookings is 'Admin-only; a client reaches their own booking only through the manage token in a route handler.';
comment on policy "booking_status_history_admin_all" on public.booking_status_history is 'Admin-only.';
comment on policy "payments_admin_all" on public.payments is 'Admin-only; gateways write via server-side webhooks.';
comment on policy "analytics_sessions_admin_all" on public.analytics_sessions is 'Admin-only; the tracker endpoint writes with the service role.';
comment on policy "analytics_pageviews_admin_all" on public.analytics_pageviews is 'Admin-only.';
comment on policy "analytics_events_admin_all" on public.analytics_events is 'Admin-only.';
comment on policy "analytics_daily_rollup_admin_all" on public.analytics_daily_rollup is 'Admin-only.';
comment on policy "admin_users_admin_all" on public.admin_users is 'Admin-only; is_admin() reads this table as security definer, so no self-select policy is needed.';
comment on policy "admin_audit_log_admin_all" on public.admin_audit_log is 'Admin-only; appended by route handlers.';
