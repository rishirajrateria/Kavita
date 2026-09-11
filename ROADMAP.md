# ROADMAP — Astrologer Kavita

Six build phases, executed strictly in order. **Do not start the next phase until told.** Each
phase ends with a working, deployable site. Read `CLAUDE.md` first in every phase.

## Phases

- [x] **Phase 0 — Scaffold.** Next.js 16.3 + TypeScript (strict) + Tailwind + shadcn/ui via pnpm; ESLint, Prettier, strict tsconfig, `.env.example`; `CLAUDE.md`, `NEEDS-REAL-DATA.md`, `ROADMAP.md` written.
- [x] **Phase 1 — Design system, layout, home page, Supabase foundation.** Tokens (`styles/tokens.css`) with full light/dark palettes, next/font, `/design-system` primitives and inline-SVG motifs; header/footer/`<Integrations />` slot reading `site_settings`, `social_links`, `integrations`; full §10 schema as migrations with RLS on every table, typed client, seed; the home page carrying the combined-method positioning with answer blocks, key-facts block, comparison table and FAQPage schema.
- [x] **Phase 2 — SEO infrastructure and the geo page engine.** Typed location data layer (`content/locations/*.ts` → Supabase) with `researchStatus`; `scripts/validate-content.ts` uniqueness/placeholder gate in CI and `prebuild`; astrologer × vastu-consultant templates at country/state/city; `generateMetadata`, OG images, typed JSON-LD generators, split sitemaps, `robots.txt` with the AI-crawler allow-list, `/llms.txt`, `/llms-full.txt`, `.md` mirror, `/for-ai`, IndexNow, internal-linking engine.
- [x] **Phase 3 — Content pages: about, astrology, vastu, services, learn, testimonials, contact.** `/about` E-E-A-T anchor, `/astrology` and `/vastu` intent hubs, `/services/[slug]`, `/learn` MDX pipeline with 8 seed articles, `/glossary/[term]` with 25 terms, `/testimonials` + `/share-your-experience` intake, `/contact`, `/faq`, `/privacy`, `/terms`, `/disclaimer`.
- [x] **Phase 4 — Booking and calendar system.** Availability rules/exceptions in Kavita's IANA timezone, server-side UTC slot generation with DST and IST half-hour tests, 7-step booking flow with dual-timezone display, race-safe slot insert, Resend/React Email notifications and cron reminders, token-based client self-service, payment seam (§11) with `NoopPaymentProvider`, private floor-plan uploads, rate limiting and audit trail.
- [x] **Phase 5 — Admin panel and first-party analytics.** `/admin` behind Supabase Auth + RLS with `admin_audit_log`; cookieless first-party tracker (`public/t.js` < 4KB) with the §13.D event fan-out registry, edge-geo ingest, daily rollups; dashboard (realtime, traffic, geography, pages incl. geo-page performance, behaviour, acquisition incl. AI-referral panel, technology, conversions); bookings, content, settings and site-identity management.
- [ ] **Phase 6 — SEO control backend and redirect engine.** `page_seo` per-route control with SERP preview and keyword checker, FAQ manager, AEO control panel (answer-block linter, llms.txt editor, per-bot crawler toggles, citability check), social/OG control, `redirects` engine in `middleware.ts` with loop/chain detection, 404 log and automatic 301 on slug change, sitemap/IndexNow/GSC/Bing control, `/admin/integrations` implementing §13 in full (pixels, CAPI, event mapping, geo-aware consent, "what's loading" preview), SEO health crawl, audit log with revert; update `CLAUDE.md`/`ROADMAP.md` and write `HANDOVER.md`.

## Phase 1 report (2026-09-10)

- Built: tokens + dark mode, self-hosted Fraunces/Inter, 24 UI primitives, 4 SVG motifs, `/design-system`,
  header with native-`<dialog>` mobile drawer, footer driven by `site_settings`/`social_links`, `<Integrations />`
  slot, sticky mobile CTA, Person/ProfessionalService/WebSite/FAQPage JSON-LD, 27-table Drizzle schema with RLS on
  every table (validated against PGlite), seed data layer with no-DB fallback, home page (≈2,500 words, 13 answer
  blocks, 1 H1, FAQPage + speakable).
- Lighthouse mobile (simulated 4G, headless Chromium 141): Performance 94–95, Accessibility 100, Best Practices 96,
  SEO 100. LCP 2.8–2.9 s simulated / 0.2 s unthrottled (LCP element is the hero paragraph; the simulated figure is
  Lantern counting all JS as pre-paint), CLS 0, TBT 110–120 ms, FCP 0.9 s. JS 158 KB transfer (framework floor
  ≈114 KB), fonts 83 KB, CSS 14 KB, HTML 40 KB.
- Held back: real photo, all contact/social/credential values (see `NEEDS-REAL-DATA.md`); `/book` and the nav
  routes 404 until Phases 3–4 (the 404 page routes usefully).

## Phase 2 report (2026-09-11)

- Built: Zod location schema + 234 Tier-1 base records; 60 researched locations (7 countries,
  20 states/regions, 33 cities) as reviewable TS files; data layer with tree queries and
  consultation-window maths (tested); astrologer × vastu-consultant templates at country/state/city
  with tier-specific block order, key-facts `<dl>`, question H2s + 40–60-word answers, tables,
  `<details>` FAQ, real-only testimonial slot, generated link graph, location-prefilled CTA;
  metadata builder (titles ≤60, descriptions 150–160, canonical, reciprocal hreflang on countries,
  noindex for partial); LocalBusiness/Service/FAQPage/BreadcrumbList/speakable JSON-LD with tests;
  on-brand `/api/og` images; sitemap index + split sitemaps with real lastmod and overflow files;
  robots.txt with 15 named AI-crawler groups; `/llms.txt`, `/llms-full.txt`, `/{path}.md` mirror,
  `/for-ai`; IndexNow utility + protected route + key file; `scripts/validate-content.ts` gate in
  `prebuild` and CI; interim `/book` page so the primary CTA resolves.
- Numbers: build 28 s clean (138 static routes, 120 geo pages); max cross-page similarity 39.5 %
  (ceiling 60 %); Lighthouse mobile on `/astrologer/india/maharashtra/mumbai`: Performance 95,
  Accessibility 100, Best Practices 100, LCP 2.8 s simulated (FCP 0.9 s), CLS 0, TBT 90 ms.
- Held back, by the brief's own rule: **0 pages indexable, 120 held at `partial`/noindex** because
  `clientConcerns` (2–3 per location) is practitioner-supplied and cannot be inferred honestly;
  174 stub locations return 404. Geo sitemaps are therefore empty until the practitioner fills
  concerns (see NEEDS-REAL-DATA §10).
- Not met: geo-page JS is ~155 KB gzipped against the 100 KB target; ~114 KB is the React + Next
  runtime floor with hydration on, so the target is unreachable without dropping hydration.

## Phase 3 report (2026-09-11)

- Built: shared content components (PageHero, Byline, QuestionSection, FaqBlock, KeyFacts, CtaBand,
  Toc, SpecTable); `/about` E-E-A-T anchor with Person schema; `/astrology` and `/vastu` hubs with
  comparison tables and geo/service links; `/services` + 9 service pages with key facts, prepare
  tables and Service schema; MDX learn pipeline with 4 categories, 8 articles (1,900–2,800 words
  each, every H2 followed by a 40–60-word answer), 25 glossary terms with DefinedTerm schema;
  `/testimonials` (real-only Review schema) + `/share-your-experience` intake; `/contact` with NAP
  microdata and ContactPoint; `/faq` aggregating 135 questions with a no-JS-safe filter;
  `/privacy`, `/terms`, `/disclaimer` generated from settings and enabled integrations;
  `contact_messages` and `testimonial_submissions` tables with RLS; Zod validation shared
  client/server, honeypot, rate limiting, §13.D event vocabulary; route registry and sitemaps
  updated (14 core, 39 learn, 60 geo URLs per family).
- Numbers: build 17 s (197 static routes); Lighthouse mobile `/astrology`: Performance 93,
  Accessibility 100, Best Practices 100, SEO 100, CLS 0, TBT 150 ms, LCP 2.9 s simulated.
- Remaining placeholders: practitioner identity, credentials, contact, socials, prices, photo,
  legal retention/refund/governing-law values (NEEDS-REAL-DATA §1–§11).

## Phase 4 report (2026-09-11)

- Built: availability rules/exceptions in the practitioner's IANA zone; UTC slot generation with
  `TZDate`, buffers, lead time, horizon and step; availability API with offline seed rules; 7-step
  booking flow (service → format → time with dual-zone slots and a grouped zone selector → details
  with inline "why we need this" and floor-plan upload → question → review → indigo confirmation
  with .ics and Google/Outlook/Apple links); server-side slot re-verification and a transactional
  insert protected by a partial unique index with "just taken" alternatives; signed expiring
  `/booking/[token]` self-service (view, reschedule within the notice period, cancel) with full
  status history; AES-256-GCM birth-detail encryption with key rotation; floor plans in a private
  Supabase Storage bucket via short-lived signed URLs; React Email confirmations, practitioner
  notifications, 24h/1h reminders, reschedule and cancellation notices, each showing both
  timezones with plain-text alternates; idempotent `notification_log`; Vercel Cron every 15 min;
  PaymentProvider seam with NoopPaymentProvider, `PAYMENTS_ENABLED` flag, webhook stub, and the
  Razorpay/Stripe how-to in CLAUDE.md §11; rate limiting and no personal data in logs.
- Tests: Kolkata vs all seven market zones in January and July (half-hour offset), New York March
  and November DST, London BST practitioner, lead/horizon/buffers/exceptions, token sign/verify/
  expiry/tamper, encryption round-trip and rotation, ICS, PGlite integration incl. a raw double-
  booking race (exactly one insert wins), reschedule window, cancel, 503 without DB; template
  rendering, dedupe, cron windows; UI format helpers. Playwright drove the whole flow at 390/1440.
- Not testable here: reschedule/cancel against a live database (no Supabase connected).

## Phase 5 report (2026-09-11)

- Tracker: `public/t.js` at 3.9 KB gzipped, cookieless, DNT/opt-out aware, sendBeacon batching;
  captures pageviews, sessions, visibility-based time on page, scroll depth, clicks with
  selector/text/position, rage and dead clicks, form abandonment, outbound and CTA clicks,
  viewport, booking funnel; conversion fan-out registry with generated `event_id`.
- Ingest: edge-geo derivation, UA parsing, bot detection, daily-salted visitor hash, no raw IP,
  always 204; hourly rollups, 90-day raw retention, rollups kept.
- Dashboard: overview, realtime (Supabase Realtime with polling fallback), traffic with 8 presets
  and previous-period comparison, geography drill-down + SVG dot map, pages incl. geo-page
  performance, behaviour (scroll heat strip, click heatmap overlay, rage/dead clicks), acquisition
  incl. the AI-referral panel, technology, conversions funnel; every panel reads rollups and is
  paginated; 69 panel queries measured on a 12-month seeded dataset, slowest 23 ms (budget 800 ms).
- Admin: Supabase Auth with owner/editor/viewer roles, proxy guard, audited route handlers with
  before/after diffs and secret redaction; bookings management (list, detail, calendar, actions,
  notes, CSV/ICS), content (testimonials, services, FAQs, locations research editor, glossary
  read-only), settings (availability, notification templates, users, feature flags incl.
  PAYMENTS_ENABLED), site identity + social-links manager with per-platform validation and live
  footer/sameAs preview. Gender is an optional self-identified booking field only, never inferred.
- Offline: with no Supabase connected the admin shows honest "connect Supabase" states;
  `ADMIN_DEV_BYPASS=true` (non-production only) renders the shell for review.
- Follow-up noted: split the root layout into (site)/(admin) groups instead of hiding the site
  header/footer on /admin with scoped CSS.

## Definition of done for every phase

- [ ] `pnpm build` passes with zero TypeScript errors and zero ESLint warnings.
- [ ] Lint and formatting clean (`pnpm lint`, Prettier); tests added in the phase pass.
- [ ] The site is deployable to Vercel in its current state — no half-built routes shipped.
- [ ] Every public page still renders its full main content with JavaScript disabled; Server Components by default.
- [ ] Core Web Vitals reported where relevant (Phase 1: home page; Phase 2: one city geo page; later phases: any new public page) against LCP < 2.0s, INP < 200ms, CLS < 0.05 on mobile 4G, and geo-page JS under 100KB gzipped.
- [ ] No new `{{PLACEHOLDER}}` or unresearched location field without a matching entry in `NEEDS-REAL-DATA.md`; honesty rules (`CLAUDE.md` §12) respected in all copy.
- [ ] Phase report delivered (what was built, what was held back and why, remaining placeholders) — then stop and wait for the next instruction.
