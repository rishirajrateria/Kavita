# ROADMAP — Astrologer Kavita

Six build phases, executed strictly in order. **Do not start the next phase until told.** Each
phase ends with a working, deployable site. Read `CLAUDE.md` first in every phase.

## Phases

- [x] **Phase 0 — Scaffold.** Next.js 16.3 + TypeScript (strict) + Tailwind + shadcn/ui via pnpm; ESLint, Prettier, strict tsconfig, `.env.example`; `CLAUDE.md`, `NEEDS-REAL-DATA.md`, `ROADMAP.md` written.
- [ ] **Phase 1 — Design system, layout, home page, Supabase foundation.** Tokens (`styles/tokens.css`) with full light/dark palettes, next/font, `/design-system` primitives and inline-SVG motifs; header/footer/`<Integrations />` slot reading `site_settings`, `social_links`, `integrations`; full §10 schema as migrations with RLS on every table, typed client, seed; the home page carrying the combined-method positioning with answer blocks, key-facts block, comparison table and FAQPage schema.
- [ ] **Phase 2 — SEO infrastructure and the geo page engine.** Typed location data layer (`content/locations/*.ts` → Supabase) with `researchStatus`; `scripts/validate-content.ts` uniqueness/placeholder gate in CI and `prebuild`; astrologer × vastu-consultant templates at country/state/city; `generateMetadata`, OG images, typed JSON-LD generators, split sitemaps, `robots.txt` with the AI-crawler allow-list, `/llms.txt`, `/llms-full.txt`, `.md` mirror, `/for-ai`, IndexNow, internal-linking engine.
- [ ] **Phase 3 — Content pages: about, astrology, vastu, services, learn, testimonials, contact.** `/about` E-E-A-T anchor, `/astrology` and `/vastu` intent hubs, `/services/[slug]`, `/learn` MDX pipeline with 8 seed articles, `/glossary/[term]` with 25 terms, `/testimonials` + `/share-your-experience` intake, `/contact`, `/faq`, `/privacy`, `/terms`, `/disclaimer`.
- [ ] **Phase 4 — Booking and calendar system.** Availability rules/exceptions in Kavita's IANA timezone, server-side UTC slot generation with DST and IST half-hour tests, 7-step booking flow with dual-timezone display, race-safe slot insert, Resend/React Email notifications and cron reminders, token-based client self-service, payment seam (§11) with `NoopPaymentProvider`, private floor-plan uploads, rate limiting and audit trail.
- [ ] **Phase 5 — Admin panel and first-party analytics.** `/admin` behind Supabase Auth + RLS with `admin_audit_log`; cookieless first-party tracker (`public/t.js` < 4KB) with the §13.D event fan-out registry, edge-geo ingest, daily rollups; dashboard (realtime, traffic, geography, pages incl. geo-page performance, behaviour, acquisition incl. AI-referral panel, technology, conversions); bookings, content, settings and site-identity management.
- [ ] **Phase 6 — SEO control backend and redirect engine.** `page_seo` per-route control with SERP preview and keyword checker, FAQ manager, AEO control panel (answer-block linter, llms.txt editor, per-bot crawler toggles, citability check), social/OG control, `redirects` engine in `middleware.ts` with loop/chain detection, 404 log and automatic 301 on slug change, sitemap/IndexNow/GSC/Bing control, `/admin/integrations` implementing §13 in full (pixels, CAPI, event mapping, geo-aware consent, "what's loading" preview), SEO health crawl, audit log with revert; update `CLAUDE.md`/`ROADMAP.md` and write `HANDOVER.md`.

## Definition of done for every phase

- [ ] `pnpm build` passes with zero TypeScript errors and zero ESLint warnings.
- [ ] Lint and formatting clean (`pnpm lint`, Prettier); tests added in the phase pass.
- [ ] The site is deployable to Vercel in its current state — no half-built routes shipped.
- [ ] Every public page still renders its full main content with JavaScript disabled; Server Components by default.
- [ ] Core Web Vitals reported where relevant (Phase 1: home page; Phase 2: one city geo page; later phases: any new public page) against LCP < 2.0s, INP < 200ms, CLS < 0.05 on mobile 4G, and geo-page JS under 100KB gzipped.
- [ ] No new `{{PLACEHOLDER}}` or unresearched location field without a matching entry in `NEEDS-REAL-DATA.md`; honesty rules (`CLAUDE.md` §12) respected in all copy.
- [ ] Phase report delivered (what was built, what was held back and why, remaining placeholders) — then stop and wait for the next instruction.
