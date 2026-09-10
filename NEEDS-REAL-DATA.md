# NEEDS-REAL-DATA

Every `{{PLACEHOLDER}}` the client must supply before this site can go live. Sourced from the
project brief (see `CLAUDE.md` §1, §7, §9.8 and §12) and the brief's "Fill-in checklist".

> **Build gate (Phase 2):** `scripts/validate-content.ts` runs in CI and `prebuild` and **fails
> any production build** while a `{{PLACEHOLDER}}` string or a placeholder testimonial from
> `content/PLACEHOLDERS.ts` remains in rendered output. The site will not go to production while
> any item below is unfilled. Every session that introduces a new placeholder or an unresearched
> location field must add it here in the same change.

Tick an item only when the real value is in the repo / database and the placeholder is gone.

## 1. About the practitioner

- [ ] `{{FULL_NAME}}` — practitioner's full name, and whether "Astrologer Kavita" is the brand or her actual name. Used in: `site_settings`, Person schema, `/about` first paragraph, author bylines on every content page, `/for-ai`, `llms.txt`, email templates.
- [ ] `{{YEARS}}` — years of practice, and the year she started (also feeds `{{YEAR}}` below). Used in: `/about`, home hero, citable sentences (§9.8), key-facts blocks.
- [ ] `{{CREDENTIALS — e.g. Jyotish Visharad, formal vastu training, lineage/guru, institutions}}` — formal training, certifications, institution, guru/lineage. Used in: `/about` credentials list, Person schema (`alumniOf`, `award`, `knowsAbout`), author bylines, `/for-ai`.
- [ ] `{{e.g. English, Hindi, Bengali}}` — languages she consults in. Used in: key-facts block on every geo and service page, `/for-ai`, `/contact`, booking flow, ProfessionalService schema.
- [ ] `{{CITY, COUNTRY}}` — city and country she is based in. Used in: `site_settings` (practitioner timezone derives from this), NAP block, LocalBusiness schema, every geo page's consultation-window calculation (§7), `/about`, `/for-ai`.
- [ ] `{{CITY}}` — whether she takes in-person clients, and where. Used in: home hero, `/contact`, booking Step 2 (in-person mode only shown to visitors in this city), LocalBusiness schema.

## 2. Contact and entity

- [ ] `{{PHONE with country code}}` — phone number. Used in: `site_settings` NAP, footer, `/contact`, `call_clicked` links, ProfessionalService/LocalBusiness schema, ContactPoint schema, email templates.
- [ ] `{{WHATSAPP}}` — WhatsApp number. Used in: `/contact`, sticky mobile CTA bar, `whatsapp_clicked` links, optional WhatsApp notification hook (Phase 4).
- [ ] `{{EMAIL}}` — public email address. Used in: `site_settings` NAP, footer, `/contact`, schema, transactional email sender/reply-to.
- [ ] Physical address, if she has a public one. Used in: LocalBusiness schema, `/contact` NAP block and embedded map (map only shown if there is a public office), Google Business Profile consistency.
- [ ] Google Business Profile URL — set one up if it does not exist (single highest-leverage local SEO asset). Used in: `social_links` row with `include_in_sameas`, Person/ProfessionalService `sameAs`, NAP consistency check.
- [ ] `{{Instagram, YouTube, Facebook, LinkedIn, Google Business Profile}}` — Instagram, YouTube, Facebook, LinkedIn URLs (and any of X, WhatsApp, Telegram, Pinterest, Threads). Used in: `social_links` seed rows (Phase 1 seeds placeholder URLs, which must be flagged here), footer icon links, header (optional), `sameAs` arrays.
- [ ] Domain name. Used in: `NEXT_PUBLIC_SITE_URL`, canonical URLs, sitemaps, hreflang, OG images, `robots.txt`, `llms.txt`, IndexNow key path, email SPF/DKIM.
- [ ] Legal entity name. Used in: `site_settings.legal_entity`, `/terms`, `/privacy`, footer.

## 3. Services and money

- [ ] `{{LIST YOUR ACTUAL SERVICES — e.g. …}}` — the exact service list with durations, and for each whether it is astrology-led, vastu-led or integrated. Used in: `services` table seed, `/services` and `/services/[slug]`, home services cards, booking Step 1, Service schema, `/for-ai`, `llms.txt`.
- [ ] `{{PRICES per service, per currency, or "on request"}}` — prices per service, and in which currencies (site takes INR, USD, GBP, AED). Used in: service pages (`price`), Service schema `offers`, ProfessionalService `priceRange`, `/for-ai`, geo-page answer blocks ("How much does … cost in …?"), future `payments` rows.
- [ ] Refund, rescheduling and cancellation policy. Used in: `/terms`, `/privacy`, booking confirmation and self-service reschedule/cancel pages (`/booking/[token]`), notification emails.
- [ ] Working hours and days, and her IANA timezone. Used in: `site_settings` (business hours, practitioner timezone), `availability_rules` seed, `openingHoursSpecification` schema, every geo page's consultation window, both-timezone display in booking and emails.
- [ ] How far ahead people can book (horizon) and the minimum notice (lead time). Used in: booking slot generation config (Phase 4), reschedule notice period.
- [ ] Per-service buffer before/after sessions. Used in: slot generation (Phase 4).

## 4. Content

- [ ] Real testimonials — client name (or first name + city), service, date, and **explicit permission to publish** (`consent_given`). Until supplied, `content/PLACEHOLDERS.ts` holds clearly-marked placeholder entries and the build gate blocks production. Used in: home testimonials strip, `/testimonials`, regional testimonial block on geo pages (omitted entirely where none exists), Review/AggregateRating schema (emitted only from real, consented reviews).
- [ ] Professional photographs of her. Used in: home hero photo slot, `/about` photo slot, Person schema `image`, OG images, image sitemap.
- [ ] Any press, features or verifiable credentials. Used in: `/about`, Person schema `award`; "as featured in" logos are never invented — omitted until real.
- [ ] `{{N}}` — number of integrated astrology-and-vastu consultations completed (only a real number). Used in: citable sentences (§9.8) on home and `/about`.
- [ ] `{{YEAR}}` — the year the practice began. Used in: citable sentences, `/about`.
- [ ] `{{X}}` — percentage of clients outside India (only a real number). Used in: citable sentences.
- [ ] Any other real numbers she can stand behind: countries served, consultations per year, etc. Used in: citable sentences, key-facts blocks, `/for-ai`. If unknown, the sentence is omitted, not estimated.
- [ ] Her methodology, what a session involves, and what she does **not** claim to do — in her own words. Used in: `/about` (E-E-A-T anchor), `/astrology`, `/vastu`, `/disclaimer`.
- [ ] Location research fields (§7) for every Tier 1 location — landmarks, regional tradition/calendar, climate/architecture facts, common client concerns, city-specific FAQs. **Phase 2 appends a per-location list here of exactly which fields are missing**; locations with `researchStatus: 'stub'` return 404 and `partial` render `noindex` until researched. Used in: every geo page; the uniqueness gate blocks unresearched locations.

## 5. Accounts to create before launch

- [ ] Supabase project (URL, anon key, service-role key). Used in: `.env`, all data access, Auth, Storage, Realtime.
- [ ] Vercel account and project. Used in: deployment, edge geo headers (consent + analytics), Vercel Cron (reminders, analytics rollup).
- [ ] Domain and DNS. Used in: production URL, email authentication.
- [ ] Resend (or another transactional email provider) with the domain's SPF/DKIM configured. Used in: booking confirmations, reminders, reschedule/cancel notices (Phase 4).
- [ ] Google Search Console property. Used in: verification tag/file (`verification_tags`), Search Console API panel (Phase 6).
- [ ] Bing Webmaster Tools property. Used in: verification, IndexNow key, Bing API panel (Phase 6).
- [ ] Google Business Profile (see §2). Used in: entity/NAP consistency, `sameAs`.

## 6. Integrations (can be added later from the admin, but collect now if she already has them)

All of these are managed in `/admin/integrations` and are **off until an ID is entered** — none are hardcoded.

- [ ] Meta Business Manager: Pixel ID, Conversions API access token, domain verification code, (optional) test-event code. Used in: `<Integrations />` Meta Pixel, server-side CAPI for `booking_completed` / `contact_submitted` / `whatsapp_clicked`, Meta domain-verification meta tag.
- [ ] Google Ads: conversion ID and labels; Google Tag ID. Used in: Google Tag injection, event mapping table (`booking_completed` → conversion label).
- [ ] GA4 measurement ID, only if she wants it alongside the first-party analytics. Used in: optional GA4 tag (never a replacement for the first-party tracker).
- [ ] LinkedIn Insight, Pinterest Tag, TikTok Pixel, Microsoft UET IDs, if she advertises there. Used in: `<Integrations />` and event mapping.
- [ ] Google Tag Manager container ID, if needed as an escape hatch.
- [ ] Search Console service-account JSON. Used in: in-admin GSC performance panel (impressions, clicks, CTR, position per page).
- [ ] Bing Webmaster API key. Used in: IndexNow submissions and in-admin Bing performance panel.
- [ ] Other verification codes (Pinterest, Yandex, Facebook domain verification). Used in: generic `verification_tags` editor.
- [ ] Decision on AI-crawler training access: allow or disallow `Google-Extended`, `GPTBot`, `Applebot-Extended`, `CCBot` (these govern training use, not just retrieval; brief defaults to allow — a deliberate business decision). Used in: generated `robots.txt`, per-bot toggles in the AEO panel (Phase 6).
