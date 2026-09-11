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

## 7. Seed data placeholders (Phase 1)

Introduced by the Supabase foundation. Each is a literal `{{PLACEHOLDER}}` string in the seed
content (`src/content/seed/*.ts`) and is upserted as-is by `pnpm db:seed`; `pnpm test:seed`
fails if any token below disappears from this file while still present in the seed.

### `src/content/seed/site-settings.ts` (`site_settings`)

- [ ] `{{LEGAL_ENTITY}}` — field `legalEntity`.
- [ ] `{{FULL_NAME}}` — field `practitionerName`.
- [ ] `{{PHONE with country code}}` — field `phone`.
- [ ] `{{WHATSAPP}}` — field `whatsapp`.
- [ ] `{{EMAIL}}` — field `email`.
- [ ] `{{CITY}}` — field `city`.
- [ ] `{{COUNTRY}}` — field `country`.
- [ ] **Assumption:** field `timezone` is seeded as `Asia/Kolkata` (`ASSUMED_PRACTITIONER_TIMEZONE`) because the primary market is India. Confirm or replace with the practitioner's real IANA timezone.
- [ ] **Assumption:** field `businessHours` is seeded as Mon–Fri 10:00–18:00, Sat 10:00–14:00, Sun closed (`{{WORKING_HOURS}}`) so consultation-window maths has an input. Replace with real hours.
- [ ] **Assumption:** `inPersonAvailable: false` and `responseTimeHours: 24` until confirmed.
- [ ] Address fields (`addressLine1/2`, `addressPostalCode`, `addressRegion`) are `null` until a public address is confirmed.

### `src/content/seed/social-links.ts` (`social_links`)

- [ ] `https://instagram.com/{{INSTAGRAM_HANDLE}}` — Instagram profile URL.
- [ ] `https://youtube.com/@{{YOUTUBE_HANDLE}}` — YouTube channel URL.
- [ ] `https://facebook.com/{{FACEBOOK_PAGE}}` — Facebook page URL.
- [ ] `https://linkedin.com/in/{{LINKEDIN_HANDLE}}` — LinkedIn profile URL.
- [ ] `{{GOOGLE_BUSINESS_PROFILE_SLUG}}` — the Google Business Profile short-link slug, i.e. the part after `https://g.page/` (`include_in_sameas`). Replace the whole URL in `src/content/seed/social-links.ts` if her profile uses a different Google URL shape.
- [ ] `https://wa.me/{{WHATSAPP_NUMBER_DIGITS}}` — WhatsApp number, digits only with country code.

### `src/content/seed/services.ts` (`services`)

- [ ] `{{PRICE}}` — field `priceNote` on all nine services; `priceMinor`, `currency` and `prices` are empty until prices per currency (INR/USD/GBP/AED) are supplied.
- [ ] **Assumption:** the nine services are the example list from CLAUDE.md §1, not a confirmed list. Confirm names, which to keep, and lead type (astrology / vastu / integrated).
- [ ] **Assumption:** durations not given in the brief were set to: Vastu for Home 60 min, Vastu for Commercial 90 min, Muhurat 30 min, Career & Business 60 min, Gemstone & Remedial 45 min. Brief-given: Integrated 90, Kundli 60, Kundli Milan 45, Follow-up 30.
- [ ] **Assumption:** `bufferAfterMinutes: 15` on every service; `deliveryModes` per service are assumed.
- [ ] Service copy (`shortDescription`, `description`, `whatToPrepare`, `whatYouReceive`) is drafted from the brief's method description and must be reviewed by the practitioner.

### `src/content/seed/locations.ts` (`locations`)

- [ ] All 19 rows (7 countries, 6 states/regions, 6 cities: Mumbai, Delhi, Bengaluru, London, Dubai, Toronto) are `researchStatus: "stub"`, `isPublished: false`, with every §7 research field `null` (`landmarks`, `tradition`, `climateArchitecture`, `clientConcerns`, `faqs`, `consultationWindow`, `bodyAstrologyMd`, `bodyVastuMd`). Phase 2 researches them; the validation gate keeps them out of the sitemap until then.
- [ ] `languages` per location are common consultation languages assumed for that place — confirm against the languages she actually consults in.
- [ ] `currency` per location is the billing currency (one of INR/USD/GBP/AED); Canada, Australia and Singapore are seeded as USD — confirm.

### `src/content/seed/faqs.ts` (`faqs`)

- [ ] Six home-page FAQs are drafted (no prices, no outcome claims); the practitioner should confirm the wording reflects how she works.

### `src/content/PLACEHOLDERS.ts`

- [ ] Three placeholder testimonials (`isPlaceholder: true`, marker `{{PLACEHOLDER_TESTIMONIAL}}`) back the no-database fallback only. They are never seeded and the build gate blocks production while they render. Replace with real, consented testimonials (see §4).

## 8. Home page and layout placeholders (Phase 1)

- [ ] `{{LANGUAGES OF CONSULTATION}}` — home key-facts block (`src/content/home.ts`); `site_settings` has no languages column yet, add one when the real list is known.
- [ ] `{{CONFIRM IN-PERSON AVAILABILITY}}` — home key-facts block; `site_settings.in_person_available` is seeded `false` until the practitioner confirms where she sees clients in person.
- [ ] `{{PRACTITIONER PHOTO}}` — `public/images/kavita-placeholder.svg` is a labelled placeholder; replace with a professional photograph (portrait, at least 960×1200) and update the hero `alt` text.
- [ ] Person/ProfessionalService `sameAs` is currently empty because every social URL is a placeholder — fills automatically once real URLs land in `social_links`.

## 9. Locations — research needed (Phase 2)

The location tree lives in `src/content/locations/` (base geography in `base/*.ts`, hand-written
§7 research in `research/<path-with-slashes-as-double-hyphens>.ts`). Status is derived, never
set: `stub` (no research file) → the page is not generated; `partial` (all research fields
present and within limits) → renders `noindex`; `complete` (partial + practitioner-supplied
`clientConcerns`) → indexable and sitemapped. `pnpm test:seed` prints the counts and
`scripts/validate-content.ts` lists every stub/partial location by path — that output is the
per-location to-do list, so it is not duplicated here.

### Practitioner-only fields (cannot be researched; must come from Kavita)

- [ ] `research.clientConcerns` for every location — the 2–3 concerns clients from that place most often bring. Left `[]` in every research file until she supplies them; no page becomes `complete` (indexable) without them (§7, §12). Used in: geo page "what clients here ask about" block, key-facts, FAQ selection.
- [ ] `research.testimonialId` per location — a real, consented, attributable client experience from that region, referenced by its `testimonials` row id. Omitted entirely where none exists; the block does not render. Used in: geo page client-experience block, `Review` schema only if real.
- [ ] `languages` per location (in `base/*.ts`) are assumed consultation-demand languages — confirm against the languages she actually consults in.
- [ ] `currency` per location is the billing currency offered there. Canada, Australia and Singapore now use CAD/AUD/SGD (contract) although §11 lists INR/USD/GBP/AED as the accepted set — confirm which currencies she will invoice in.
- [ ] Practitioner business hours and IANA timezone (`site_settings`) — every consultation window on every geo page is computed from these; while the seeded 10:00–18:00 IST stands, windows are shown against those hours. If hours are absent the code assumes 09:00–20:00 and says so in the page note.

## 10. Location research — Phase 2 status (2026-09-11)

- **60 locations researched** (7 countries, 20 states/regions, 33 cities) and all held at `partial`
  (rendered, `noindex`) because `clientConcerns` is practitioner-supplied. To make a page indexable,
  add 2–3 concerns clients from that place most often bring to its file in
  `src/content/locations/research/` — the validator promotes it to `complete` automatically and the
  sitemap picks it up on the next build.
- **174 locations are stubs** (404 until researched): all remaining Indian cities and states, most
  US/UK/CA/AU regions and their cities. `pnpm validate:content` prints the full list.
- Skipped deliberately for lack of verifiable facts: Manchester (no solid temple/neighbourhood
  landmarks); Dubai/Abu Dhabi/Sharjah emirate-level pages (identical territory to the city);
  New York/Illinois/New South Wales/Victoria state pages; Punjab (no in-scope city under it).
- Every `consultingFrom` text states sessions are video/phone with a written summary afterwards and
  that in-person availability depends on the practitioner's base city — the practitioner must
  confirm this process description.
- No `testimonialId` is set anywhere; regional testimonial blocks stay hidden until a real,
  consented testimonial exists for that region.

## 11. Client concerns to review (2026-09-11)

At the owner's request (CLAUDE.md, "Owner decisions (2026-09-11)"), all 60 `clientConcerns` sets
in `src/content/locations/research/` were written by the build team rather than left empty. They
are informed generalisations of the topics people from each place and housing context typically
bring to an integrated astrology-and-vastu consultation, grounded in the verifiable facts already
in each file (housing stock, calendar, birth-records history, time zone, diaspora pattern). They
are phrased as topics, never as claims about Kavita's actual clients, and contain no numbers.
Every geo page is now `complete` (indexable) on their strength, so Kavita should read and edit
them in her own words — each file's `clientConcerns` array, 2–3 entries:

- [ ] `australia.ts`, `australia--new-south-wales--sydney.ts`, `australia--victoria--melbourne.ts`
- [ ] `canada.ts`, `canada--british-columbia.ts`, `canada--british-columbia--vancouver.ts`, `canada--ontario.ts`, `canada--ontario--brampton.ts`, `canada--ontario--toronto.ts`
- [ ] `india.ts`, `india--chandigarh.ts`, `india--chandigarh--chandigarh.ts`, `india--delhi.ts`, `india--delhi--delhi.ts`, `india--gujarat.ts`, `india--gujarat--ahmedabad.ts`, `india--gujarat--surat.ts`, `india--haryana.ts`, `india--haryana--gurugram.ts`, `india--karnataka.ts`, `india--karnataka--bengaluru.ts`, `india--kerala.ts`, `india--kerala--kochi.ts`, `india--madhya-pradesh.ts`, `india--madhya-pradesh--indore.ts`, `india--maharashtra.ts`, `india--maharashtra--mumbai.ts`, `india--maharashtra--pune.ts`, `india--rajasthan.ts`, `india--rajasthan--jaipur.ts`, `india--tamil-nadu.ts`, `india--tamil-nadu--chennai.ts`, `india--telangana.ts`, `india--telangana--hyderabad.ts`, `india--uttar-pradesh.ts`, `india--uttar-pradesh--lucknow.ts`, `india--uttar-pradesh--noida.ts`, `india--west-bengal.ts`, `india--west-bengal--kolkata.ts`
- [ ] `singapore.ts`, `singapore--singapore--singapore-city.ts`
- [ ] `united-arab-emirates.ts`, `united-arab-emirates--abu-dhabi--abu-dhabi.ts`, `united-arab-emirates--dubai--dubai.ts`, `united-arab-emirates--sharjah--sharjah.ts`
- [ ] `united-kingdom.ts`, `united-kingdom--england.ts`, `united-kingdom--england--birmingham.ts`, `united-kingdom--england--leicester.ts`, `united-kingdom--england--london.ts`
- [ ] `united-states.ts`, `united-states--california.ts`, `united-states--california--san-francisco-bay-area.ts`, `united-states--illinois--chicago.ts`, `united-states--new-jersey.ts`, `united-states--new-jersey--edison.ts`, `united-states--new-york--new-york-city.ts`, `united-states--texas.ts`, `united-states--texas--dallas.ts`, `united-states--texas--houston.ts`

If a set is wrong for a place, replace it or set it back to `[]` — the validator then returns
that location to `partial` (`noindex`) automatically. The header comments in these files and the
"§9 Practitioner-only fields" entry above still describe the field as practitioner-supplied; that
remains the intent for the final wording.

## 11. Legal pages (Phase 3, P3-D)

Copy lives in `src/content/legal/{privacy,terms,disclaimer}.ts`; the identity fields (legal entity,
practitioner name, email, city/country) are read from `site_settings` and are already listed in §1–2.
Every item below renders as "… ({{PLACEHOLDER}} — to confirm)" next to a sensible default until the
practitioner confirms or replaces it.

- [ ] `{{RETENTION_CONTACT_MONTHS}}` — how long contact-form messages are kept (default shown: 12 months). Used in: `/privacy` retention table and answer.
- [ ] `{{RETENTION_BOOKING_YEARS}}` — how long booking/consultation records are kept for tax and accounting (default shown: 7 years; confirm against the rules of her jurisdiction). Used in: `/privacy` retention table.
- [ ] `{{RETENTION_TESTIMONIAL_UNPUBLISHED_MONTHS}}` — how long an unpublished testimonial submission is kept (default shown: 6 months). Used in: `/privacy` retention table.
- [ ] `{{HOSTING_REGION}}` — the Supabase project region (e.g. `ap-south-1 (Mumbai)`) and, if different, the Vercel function region. Used in: `/privacy` "who is data shared with" and international-transfers section.
- [ ] `{{PRIVACY_CONTACT_EMAIL}}` — confirm that `site_settings.email` is the address for privacy/GDPR requests, or supply a dedicated one. Used in: `/privacy` controller block, rights section and contact block.
- [ ] `{{RESCHEDULE_NOTICE_HOURS}}` — minimum notice to reschedule or cancel (default shown: 24 hours). Used in: `/terms` rescheduling section; Phase 4 self-service reschedule page must use the same value.
- [ ] `{{CANCELLATION_POLICY}}` — what happens on a late cancellation or no-show (default wording shown in `/terms`). Used in: `/terms`, booking emails (Phase 4).
- [ ] `{{REFUND_POLICY}}` — when fees are refunded (default wording shown in `/terms`). Used in: `/terms`, booking emails (Phase 4).
- [ ] `{{GOVERNING_LAW_JURISDICTION}}` — governing law and courts (e.g. "India, courts of {{CITY}}"). Used in: `/terms` governing-law section.
- [ ] Practitioner to read and approve all three pages; they state what the code does (encryption of birth details, private storage with signed links, cookieless analytics with 90-day raw retention, no payment data in v1, 18+ to book) and must be revised in the same change as any behaviour change. The `/privacy#analytics` section describes the Phase 5 tracker in advance so the policy and the code match when it ships.
- [ ] The `/privacy` marketing-pixels section is generated from enabled `integrations` rows at build time; when the owner enables a tag from the admin, rebuild (or revalidate) the page so the list updates.

## 10. Practitioner profile, `/about`, `/astrology` and `/vastu` (Phase 3)

Introduced by `src/content/practitioner.ts` and the three content pages. Author bylines on every
content page show the plain job title ("Vedic astrologer and vastu consultant") until the
credentials below are real; `/about` lists each pending placeholder visibly.

- [ ] `{{CREDENTIAL_ASTROLOGY}}` — formal Jyotish qualification (e.g. Jyotish Visharad), awarding body and year. Used in: `/about` credentials list, `credentialLine()` bylines on every content page, Person schema.
- [ ] `{{CREDENTIAL_VASTU}}` — formal vastu shastra training, institution and year. Used in: `/about` credentials list, bylines, Person schema.
- [ ] `{{LINEAGE}}` — guru or parampara under whom she studied, if any (leave empty if none; the row is then removed). Used in: `/about` credentials list.
- [ ] `{{INSTITUTIONS}}` — colleges, academies or boards attended. Used in: `/about` credentials list; also fills `PRACTITIONER.alumniOf` → Person schema `alumniOf` (emitted only when real).
- [ ] `PRACTITIONER.awards` — verifiable awards or recognitions, if any (empty array until real; never a placeholder in JSON-LD). Used in: Person schema `award`, `/about`.
- [ ] `{{YEARS}}`, `{{YEAR}}`, `{{N}}`, `{{X}}` — reused from §1/§4 in the `/about` "How long has Astrologer Kavita been practising?" section as citable sentences (§9.8). Only real numbers may replace them; if a figure is unknown the sentence is removed, not estimated.
- [ ] `{{LANGUAGES OF CONSULTATION}}` — reused from §8 in `/about` (languages section and answer), the `/astrology` and `/vastu` key-facts bands, and Person schema `knowsLanguage` (emitted only when real).
- [ ] `{{CONFIRM IN-PERSON AVAILABILITY}}` — reused from §8 in the `/about` first paragraph and "Where does she consult?" answer, and in the hub key-facts "Consultation modes" rows; the copy switches to "and in person in {city}" automatically once `site_settings.in_person_available` is true.
- [ ] `/about` methodology, "what a session involves", "what she can and cannot tell you" and "what she does not claim to do" are drafted from the brief's method description and CLAUDE.md §12; the practitioner must confirm every sentence reflects how she actually works (in particular the six method steps and the written-summary promise).
- [ ] `/astrology` and `/vastu` hub copy describes the traditions (Vimshottari periods, sidereal vs tropical, the directional scheme, non-structural corrections) as textbook Jyotish / classical vastu, hedged where schools differ; the practitioner should confirm the chart style(s) she draws, the ayanamsa she uses, the sleeping-direction and entrance preferences she teaches, and the compass-reading instructions match her own practice.
- [ ] `ABOUT_DATES`, `ASTROLOGY_DATES`, `VASTU_DATES` (`src/content/pages/*.ts`) and `src/content/route-dates.ts` carry the visible `datePublished` / `dateModified`; bump `modified` in the same change that edits the copy.

## Booking engine (Phase 4)

- `{{WORKING_HOURS}}` — `src/content/seed/availability.ts` derives the bookable rules from the
  assumed business hours (Mon–Fri 10:00–18:00, Sat 10:00–14:00, `Asia/Kolkata`). The
  availability API flags `placeholderRules: true` until real rules exist in `availability_rules`.
- `{{BOOKING_RULES}}` — `site_settings.lead_time_hours` (24), `horizon_days` (60),
  `reschedule_notice_hours` (24) and `slot_step_minutes` (30) are contract defaults to confirm.
- Service `buffer_after_minutes` (15) and every service duration remain the Phase 3 assumptions.
