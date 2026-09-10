@AGENTS.md

# Astrologer Kavita — Project Brief

> Production website for a professional astrologer and vastu consultant. A real commercial
> project that must rank in Google, Bing and AI answer engines. This file is the single source
> of truth for every future session — nothing here may be lost or contradicted. Every
> `{{PLACEHOLDER}}` is unfilled client data (tracked in `NEEDS-REAL-DATA.md`). Phase plan lives
> in `ROADMAP.md`. Do not start a phase until told to.

## 1. The business

| Field                      | Value                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Brand name                 | Astrologer Kavita                                                                          |
| Practitioner               | {{FULL_NAME}}, {{YEARS}} years of practice                                                 |
| Credentials                | {{CREDENTIALS — e.g. Jyotish Visharad, formal vastu training, lineage/guru, institutions}} |
| Languages of consultation  | {{e.g. English, Hindi, Bengali}}                                                           |
| Based in                   | {{CITY, COUNTRY}}                                                                          |
| Consults                   | online worldwide (video/phone) + in-person in {{CITY}}                                     |
| Contact                    | {{PHONE with country code}}, {{EMAIL}}, {{WHATSAPP}}                                       |
| Social / `sameAs` profiles | {{Instagram, YouTube, Facebook, LinkedIn, Google Business Profile}}                        |
| Pricing                    | {{PRICES per service, per currency, or "on request"}}                                      |

### Core positioning — the single most important thing about this site

Most practitioners do astrology OR vastu. Kavita does both, together, as **one integrated
reading**. The horoscope tells you what is happening in a person's life and when; the vastu of
their home or workplace tells you what in their physical environment is amplifying or blocking
it. Neither science alone gives the full picture. A weak Mars in a chart plus a south-east
bedroom is a different remedy than a weak Mars alone.

Every page — especially the home page — must communicate this combined approach as the
differentiator. **Never present astrology and vastu as two separate menu items that happen to
share a website. They are one method with two instruments.**

### Services offered

{{LIST YOUR ACTUAL SERVICES — e.g.

- Integrated Life Reading (birth chart + home vastu), 90 min
- Kundli / birth chart analysis, 60 min
- Match making / kundli milan, 45 min
- Vastu consultation for home, on-site or via floor plan
- Vastu for commercial / office / factory
- Muhurat (auspicious timing) selection
- Career & business consultation
- Gemstone and remedial guidance
- Follow-up session, 30 min}}

Each service page must state whether it is astrology-led, vastu-led, or integrated.

## 2. Target markets

| Tier      | Markets                                                                  |
| --------- | ------------------------------------------------------------------------ |
| Primary   | India                                                                    |
| Secondary | USA, United Kingdom, UAE (Dubai/Abu Dhabi), Canada, Australia, Singapore |

- Audience: English-speaking, strong Indian-diaspora skew outside India.
- Write in clear international English.
- Use Sanskrit/Vedic terms where they are the correct term (kundli, dasha, vastu shastra,
  muhurat) but **always define them on first use on a page** — for first-time readers and for
  AI models extracting definitions.

## 3. Tech stack — non-negotiable

| Concern         | Choice                                                                       |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | Next.js 15+, App Router, TypeScript, strict mode                             |
| Styling         | Tailwind CSS + shadcn/ui                                                     |
| Backend         | Supabase: Postgres, Auth, Row Level Security, Realtime, Storage              |
| ORM             | Drizzle ORM (or Supabase client with typed schema — pick one, be consistent) |
| Deployment      | Vercel                                                                       |
| Package manager | pnpm                                                                         |
| Validation      | Zod, on both client and server, for all input                                |
| Fonts           | next/font, self-hosted, no render-blocking Google Fonts request              |
| Images          | next/image for all images, AVIF + WebP                                       |

### Architectural rules

- Every public marketing page is SSG or ISR. No public content page may require client-side JS
  to display its main content. With JS disabled, the full text of every page must still be in
  the HTML. **This is the single most important technical requirement for AI-engine visibility.**
- Server Components by default. `"use client"` only where interaction genuinely requires it,
  and never on a component that contains primary page copy.
- No content loaded via `useEffect`. Ever.
- Route handlers for all writes. No direct DB access from client components.
- All secrets server-side only. `NEXT_PUBLIC_` prefix only for the Supabase anon key and the
  site URL.
- Core Web Vitals targets (mobile 4G): **LCP < 2.0s, INP < 200ms, CLS < 0.05**.
- Total JS on a geo landing page: **under 100KB gzipped**.

## 4. Design direction

Premium and calm, not mystical-kitsch. Must look like a practice a Dubai finance professional
and a Delhi homemaker would both trust.

| Avoid                                                                                                                                  | Aim for                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purple gradients, glowing crystal balls, animated stars, neon zodiac wheels, stock galaxy photos, Comic-Sans-adjacent "mystical" fonts | Warm ivory/parchment backgrounds; deep indigo/midnight text; restrained antique-gold accent; generous whitespace; refined serif headings (Fraunces, Cormorant or Marcellus) + clean humanist sans body (Inter or Source Sans 3); fine line-art inline-SVG motifs (subtle chart square, vastu compass rose, thin astronomical linework) as quiet accents, never loud decoration |

- **Client mandate (Phase 1 feedback): the site must look stunning and be very easy to use; aesthetics are
  non-negotiable.** Within the palette above, that means visual rhythm (alternating ivory / parchment /
  deep-indigo sections), a cinematic but quiet hero, large low-opacity gold line-art motifs as backdrops,
  solid antique-gold primary CTAs, editorial typography (Fraunces display sizes, balanced headings),
  hairline gold rules and ornaments, hover micro-interactions, and an indigo footer. Every new page must
  be screenshot-reviewed at 1440px and 390px, light and dark, before it is reported done. Never let a page
  read as a plain document.
- Build a proper design system first: CSS custom properties for the full colour scale, type
  scale, spacing scale, radii, shadows. Every component reads from tokens.
- Full dark mode via CSS variables: light palette on `:root`, overrides under
  `@media (prefers-color-scheme: dark)` and under an explicit `[data-theme]` attribute so a
  manual toggle works in both directions.
- Accessibility is not optional: WCAG 2.2 AA contrast, visible focus rings, real semantic
  landmarks, skip link, all interactive elements keyboard-reachable, `prefers-reduced-motion`
  respected.

## 5. Site map and URL structure

### Core pages

| Route                                       | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| `/`                                         | Home — the combined astrology+vastu story          |
| `/about`                                    | About Kavita — deep E-E-A-T page                   |
| `/astrology`                                | Astrology hub, optimised for astrology intent      |
| `/vastu`                                    | Vastu hub, optimised for vastu intent              |
| `/services`                                 | All services index                                 |
| `/services/[service-slug]`                  | One page per service                               |
| `/learn`                                    | Learn hub — articles, guides, glossary             |
| `/learn/[category]`                         | Category hub                                       |
| `/learn/[category]/[article-slug]`          | Article                                            |
| `/glossary/[term]`                          | One page per term (kundli, dasha, brahmasthan, …)  |
| `/testimonials`                             | All client experiences                             |
| `/book`                                     | Booking flow                                       |
| `/contact`                                  | Contact                                            |
| `/faq`                                      | Master FAQ                                         |
| `/privacy`, `/terms`, `/disclaimer`         | Legal                                              |
| `/for-ai`                                   | Plain factual machine-friendly summary (see §9.11) |
| `/llms.txt`, `/llms-full.txt`, `/{path}.md` | AI-ingestion outputs (see §9.5–9.6)                |

### Geo pages — the SEO engine

| Route                                        | Example                                |
| -------------------------------------------- | -------------------------------------- |
| `/astrologer/[country]`                      | `/astrologer/india`                    |
| `/astrologer/[country]/[state]`              | `/astrologer/india/maharashtra`        |
| `/astrologer/[country]/[state]/[city]`       | `/astrologer/india/maharashtra/mumbai` |
| `/vastu-consultant/[country]`                |                                        |
| `/vastu-consultant/[country]/[state]`        |                                        |
| `/vastu-consultant/[country]/[state]/[city]` |                                        |

### URL rules

- Lowercase, hyphenated, no trailing slash, no IDs in URLs.
- Slugs are immutable once published. If one must change, a 301 is mandatory — the redirect
  engine (Phase 6) exists for exactly this.
- Every geo page links **up** to its parent, **sideways** to 4–6 sibling locations, **across**
  to its astrology/vastu counterpart, and **down** to any children.
- No orphan pages. No page more than 3 clicks from home.

## 6. Geo page scope — Tier 1 (~400 pages)

- **Countries (7):** India, United States, United Kingdom, United Arab Emirates, Canada,
  Australia, Singapore
- **Indian states/UTs:** all 28 states + 8 union territories
- **Indian cities (~60):** Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune,
  Ahmedabad, Jaipur, Surat, Lucknow, Kanpur, Nagpur, Indore, Bhopal, Patna, Vadodara, Ludhiana,
  Agra, Nashik, Varanasi, Rajkot, Meerut, Amritsar, Coimbatore, Kochi, Thiruvananthapuram,
  Chandigarh, Guwahati, Bhubaneswar, Dehradun, Raipur, Ranchi, Jodhpur, Udaipur, Mysuru,
  Mangaluru, Madurai, Vijayawada, Visakhapatnam, Noida, Gurugram, Ghaziabad, Faridabad, Thane,
  Navi Mumbai, Gwalior, Jabalpur, Aurangabad, Srinagar, Jammu, Shimla, Panaji, Puducherry,
  Tiruchirappalli, Salem, Hubballi, Jalandhar, Bareilly, Aligarh
- **International cities (~45):** New York, New Jersey (Edison), Chicago, Houston, Dallas,
  Atlanta, San Francisco Bay Area, Los Angeles, Seattle, Boston, Washington DC, Philadelphia,
  Phoenix, Austin, Charlotte, Detroit, Minneapolis, Tampa; London, Birmingham, Leicester,
  Manchester, Leeds, Glasgow, Slough, Wembley, Southall, Nottingham; Dubai, Abu Dhabi, Sharjah,
  Ajman; Toronto, Brampton, Mississauga, Vancouver, Surrey BC, Calgary, Edmonton, Montreal,
  Ottawa; Sydney, Melbourne, Brisbane, Perth, Adelaide; Singapore
- **Middle tier:** US states, UK nations/regions, UAE emirates, Canadian provinces, Australian
  states.
- Each location × 2 services (astrologer, vastu-consultant) ≈ 400 pages.

**ARCHITECT THE DATA LAYER SO TIER 2 AND TIER 3 ARE JUST MORE ROWS.** Locations live in a typed
data source, not in code. Adding 500 more cities must require zero component changes.

## 7. The content uniqueness rule — read this twice

400 near-identical pages with a swapped city name is the fastest way to get this site
classified as spam. Google's 2024+ scaled-content-abuse policy targets exactly this pattern.

Therefore every location record in the data layer MUST carry real, researched,
location-specific fields, and **a page MUST NOT be generated for a location whose record is
incomplete.** Required fields per city:

| Field                       | Requirement                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timezone                    | plus the current UTC offset relative to Kavita's timezone                                                                                                                                                      |
| Consultation window         | what local hours work for a live session with {{CITY, COUNTRY}}                                                                                                                                                |
| Landmarks                   | 2–4 named local landmarks, temples or neighbourhoods (real, verifiable)                                                                                                                                        |
| Regional tradition/calendar | dominant astrological tradition or calendar (e.g. North vs South Indian chart style, Amanta vs Purnimanta month reckoning, Tamil/Malayalam/Bengali calendar)                                                   |
| Climate/architecture        | 2–3 facts that genuinely change vastu advice there: prevailing wind, dominant sun exposure, typical housing stock (high-rise apartment vs villa vs Victorian terrace vs desert villa), common plot orientation |
| Client concerns             | the 2–3 concerns clients from this place most often bring                                                                                                                                                      |
| FAQs                        | 3–5 city-specific FAQs with city-specific answers                                                                                                                                                              |
| Client experience           | a real client experience from that region if one exists — otherwise omit the block entirely                                                                                                                    |

**VALIDATION GATE:** a script that runs in CI and fails the build if any published location has
fewer than the required fields, or if the body copy of any two pages exceeds **60% similarity**
(shingle/Jaccard comparison). Pages that fail are excluded from the sitemap and marked `noindex`
until fixed.

- Minimum **700 words** of genuinely location-specific body copy per geo page, on top of shared
  brand sections.
- Better to ship 120 excellent geo pages than 400 thin ones. If the data for a location is not
  there, do not publish that location.

## 8. SEO strategy — classic search

### On-page

- One clear primary keyword per page, in: title, H1, first 100 words, URL, one H2, image alt,
  meta description.
- Title format: `Astrologer in {City} | Vedic Astrology & Vastu — Astrologer Kavita` — under
  60 chars where possible.
- Meta description: 150–160 chars, written to earn the click, includes the location and a
  differentiator.
- Exactly one H1 per page. Logical H2/H3 nesting, never skipped levels.
- Canonical URL on every page, self-referencing, absolute.
- Breadcrumbs, visible and marked up, on every non-home page.

### International

- hreflang cluster on country-level pages: `en-IN`, `en-US`, `en-GB`, `en-AE`, `en-CA`,
  `en-AU`, `en-SG`, plus `x-default`. Reciprocal — every page in a cluster lists every other.

### Crawl & indexing

- Sitemaps: index at `/sitemap.xml` → `/sitemap-pages.xml`, `/sitemap-geo-astrology.xml`,
  `/sitemap-geo-vastu.xml`, `/sitemap-learn.xml`. Max 5,000 URLs per file. Accurate `lastmod`
  from real content mtime, **never `new Date()`**.
- `robots.txt` generated from route config, disallowing `/admin`, `/api`, `/_next`, and any
  thin or paginated duplicate.
- Image sitemap for practitioner photos and any chart/floor-plan diagrams.
- 404 page that routes usefully; a proper 410 for intentionally removed content.
- IndexNow ping to Bing on every publish/update — matters more than usual: ChatGPT's search
  leans on Bing's index.
- Google Search Console and Bing Webmaster verification files/meta wired in via env vars.

### Structured data — JSON-LD, typed, generated from real data, never hardcoded

| Type                                                                | Where / details                                                                                                                                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Person`                                                            | Kavita: `jobTitle`, `knowsAbout`, `alumniOf`, `award`, `sameAs`, `image`                                                                                                                                     |
| `ProfessionalService` (+ `LocalBusiness` for the physical location) | full NAP, `areaServed` per geo page, `openingHoursSpecification`, `priceRange`                                                                                                                               |
| `Service`                                                           | per service page: `provider`, `serviceType`, `areaServed`, `offers`                                                                                                                                          |
| `FAQPage`                                                           | every page with an FAQ block — every geo page has one                                                                                                                                                        |
| `BreadcrumbList`                                                    | every page                                                                                                                                                                                                   |
| `Article`                                                           | Learn content: `author`, `datePublished`, `dateModified`                                                                                                                                                     |
| `WebSite` + `SearchAction`                                          | home                                                                                                                                                                                                         |
| `DefinedTerm` / `DefinedTermSet`                                    | glossary pages                                                                                                                                                                                               |
| `Review` + `AggregateRating`                                        | ONLY from real, verifiable, attributable client feedback. If real reviews are not supplied, omit these types entirely. Never generate review markup from invented content — manual-action risk and dishonest |
| `speakable`                                                         | on answer blocks, for voice assistants including Siri                                                                                                                                                        |

### E-E-A-T (carries real weight in this category)

- Every content page carries a visible author byline linking to `/about`, with credentials.
- `/about` is substantial: training, lineage, years practising, methodology, what she does not
  claim to do.
- Publish and visibly display `datePublished` and `dateModified`.
- Clear, honest disclaimer page: astrology and vastu are traditional practices offered for
  guidance and reflection, not a substitute for medical, legal or financial advice. Linked in
  the footer.
- Real, consistent NAP across the site, the Google Business Profile and every social profile.
  Entity consistency is what lets search engines and LLMs resolve "Astrologer Kavita" to one
  entity.

## 9. AEO / LLM optimisation — ChatGPT, Gemini, Claude, Perplexity, Siri

Models surface a site two ways: training data, and — far more actionably — live retrieval and
citation by their search layer. Optimise for retrieval and citation:

1. **Server-rendered text.** AI crawlers render little or no JS. Everything in the HTML, always
   (see §3).
2. **Answer blocks.** Every H2 on a content or geo page is phrased as a real question a person
   would type or say ("How much does a vastu consultation cost in Dubai?"). Immediately under
   it, before any elaboration, a **40–60 word self-contained answer** in `<p class="answer">`.
   Self-contained = makes sense quoted alone, no pronouns pointing at earlier paragraphs, names
   the subject explicitly: "A vastu consultation for a Dubai apartment with Astrologer Kavita…"
   not "It typically costs…".
3. **Key facts block.** Near the top of every geo and service page, a compact definition list:
   service, practitioner, area served, consultation modes, languages, session length, timezone
   window, response time. LLMs lift these almost verbatim.
4. **Tables.** Comparison/specification tables extract extremely well. Use them: astrology vs
   vastu (what each answers), consultation types compared, North vs South Indian chart style,
   what to prepare for each session type.
5. **`/llms.txt` and `/llms-full.txt`**, generated at build time. `llms.txt` = structured
   markdown index (who Kavita is, what she offers, where, linked map of key pages).
   `llms-full.txt` = full text of the core pages concatenated as clean markdown. Serve both as
   `text/plain`; link them from `robots.txt`.
6. **Markdown mirror.** Requesting `/{path}.md` returns clean markdown of that page.
7. **`robots.txt` explicitly ALLOWS**, each in its own named group with `Allow: /`:
   `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`,
   `PerplexityBot`, `Google-Extended`, `Bingbot`, `Applebot`, `Applebot-Extended`, `Amazonbot`,
   `Bytespider`, `CCBot`, `Meta-ExternalAgent`.
   Note for the site owner: `Google-Extended`, `GPTBot`, `Applebot-Extended` and `CCBot` govern
   training use, not just retrieval. Allowing them maximises the chance the brand is known to
   future models; it also means the content can be used in training. That is a business
   decision — make it deliberately. `Applebot` is the one that matters for Siri and Spotlight;
   allow it regardless.
8. **Citable sentences.** At least three per major page that a model would want to quote:
   specific, attributable, dated. "Kavita has completed over {{N}} integrated
   astrology-and-vastu consultations since {{YEAR}}, roughly {{X}}% of them for clients outside
   India." **Only real numbers.** Never invent a statistic to look citable — a fabricated number
   that gets quoted back is a permanent reputational problem.
9. **Entity clarity.** State plainly, in prose, in the first paragraph of `/about`: who she is,
   what she practises, where she is based, what makes the method distinct. Models resolve
   entities from plain declarative prose far better than from marketing copy.
10. **Conversational long-tail.** Build Learn around the questions people actually ask
    assistants: "is vastu applicable to apartments", "can vastu be corrected without
    demolition", "what is my rashi if I was born at 11pm", "do I need my exact birth time for a
    kundli", "vastu for a north-facing flat in Bangalore", "how do astrology and vastu work
    together". One page per real question cluster.
11. **`/for-ai` page.** Plain, factual, machine-friendly summary of the practice — services,
    coverage, credentials, contact, pricing, what to bring to a consultation — no marketing
    language. Linked in the footer and in `llms.txt`.

## 10. Data model (Supabase / Postgres)

RLS on every table, `created_at`/`updated_at` on every table, generated TypeScript types.

| Table(s)                                                                                  | Notes                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site_settings`                                                                           | single row: brand name, NAP, business hours, practitioner timezone, default currency, legal entity — the ONE source of truth the footer, contact page and every schema block read from |
| `social_links`                                                                            | platform, url, label, icon, sort_order, is_visible, show_in_footer, show_in_header, include_in_sameas                                                                                  |
| `integrations`                                                                            | provider, config JSONB, is_enabled, loads_in_regions, updated_by (see §13)                                                                                                             |
| `verification_tags`                                                                       | provider, meta_name, meta_content, or file_path/file_content for file-based verification                                                                                               |
| `consent_log`                                                                             | anonymous visitor id, region, choices JSONB, timestamp                                                                                                                                 |
| `services`, `service_translations`                                                        |                                                                                                                                                                                        |
| `locations`                                                                               | self-referencing tree country → state → city, with the §7 research fields as typed JSONB + columns                                                                                     |
| `page_seo`                                                                                | per-route SEO overrides (Phase 6)                                                                                                                                                      |
| `faqs`                                                                                    | attachable to any route or location                                                                                                                                                    |
| `articles`, `article_categories`, `glossary_terms`                                        |                                                                                                                                                                                        |
| `testimonials`                                                                            | `is_published`, `consent_given`, `source`, `client_location_id`                                                                                                                        |
| `availability_rules`, `availability_exceptions`, `bookings`, `booking_status_history`     |                                                                                                                                                                                        |
| `clients`                                                                                 | name, email, phone, birth details, timezone — sensitive personal data: encrypt birth details at rest, restrict via RLS                                                                 |
| `payments`                                                                                | created but unused in v1 (see §11)                                                                                                                                                     |
| `redirects`                                                                               |                                                                                                                                                                                        |
| `analytics_events`, `analytics_sessions`, `analytics_pageviews`, `analytics_daily_rollup` |                                                                                                                                                                                        |
| `admin_users`, `admin_audit_log`                                                          |                                                                                                                                                                                        |

Birth details, floor plans and client names are personal data. Encrypt at rest, never log
them, never expose them to any client-side query, and add a real privacy policy that says what
is stored and for how long. If any client is in the UK/EU, GDPR applies to this site.

## 11. Payments — build the seam, not the feature

No payment gateway in v1. Adding one must be a matter of implementing one interface:

- `payments` table with provider-agnostic columns: provider, provider_ref, amount_minor,
  currency, status, idempotency_key.
- `PaymentProvider` TypeScript interface: `createIntent`, `capture`, `refund`, `verifyWebhook`.
- `NoopPaymentProvider` used in v1, marking bookings `payment_pending_offline`.
- Booking states already include `awaiting_payment` and `paid`, unused for now.
- `PAYMENTS_ENABLED` feature flag read from env, gating the UI.
- `/api/webhooks/payments/[provider]` route stubbed with signature-verification scaffolding.
- Currencies taken: INR, USD, GBP, AED.

### How to add a real gateway (to be expanded in Phase 4)

Razorpay (India) and Stripe (international): implement `PaymentProvider` once per gateway,
register it by provider key, fill in `verifyWebhook` with the gateway's signature scheme in
`/api/webhooks/payments/[provider]`, map gateway statuses onto the `payments.status` column,
add the gateway's server-side keys to `.env.example` (never `NEXT_PUBLIC_`), then flip
`PAYMENTS_ENABLED`. Phase 4 writes the exact, tested steps here.

## 12. Honesty rules for all generated content — ABSOLUTE

These are absolute. Violating them creates legal and SEO risk for a real business.

- NEVER invent testimonials, client names, review counts, star ratings, or "as featured in" logos. Where real ones are not yet supplied, build the component and populate it with clearly-marked placeholder data in a single `content/PLACEHOLDERS.ts` file, and add a build-time check that fails production builds if placeholder testimonials are still present.
- NEVER invent statistics, years of experience, client counts, or credentials. Use `{{PLACEHOLDER}}` and list every one in a `NEEDS-REAL-DATA.md` file at the repo root.
- NEVER write copy that promises outcomes: no "guaranteed results", no "100% accurate predictions", no health, fertility, legal or financial outcome claims, no "cure". Astrology and vastu are offered as traditional guidance. Copy should be confident about the practice and honest about what it is.
- NEVER fabricate the location research in §7. If you do not know a real fact about a city's housing stock or regional calendar, leave the field empty so the validation gate blocks the page, and list it in NEEDS-REAL-DATA.md.
- Every claim on the site must be one the practitioner can stand behind.

## 13. Integrations — managed from the admin, never hardcoded

The site owner must be able to connect and disconnect every external service from the admin
panel without a deploy. Nothing in this section may be hardcoded in a layout or component;
everything reads from `site_settings`, `social_links`, `integrations` and `verification_tags`.

### A. Social links

- Managed in admin: add/edit/reorder/hide links for Instagram, YouTube, Facebook, LinkedIn, X,
  WhatsApp, Telegram, Pinterest, Threads, and a free-form "other".
- Rendered in the footer (always, when visible) and optionally in the header, as accessible
  icon links with `rel="me noopener"`, correct `aria-label`s, inline SVG icons — no icon font,
  no third-party icon CDN.
- Every visible link with `include_in_sameas` is emitted in the `sameAs` array of the Person
  and ProfessionalService schema. Social links are an SEO feature here, not decoration.
- Optional social-proof widgets (YouTube channel embed, Instagram feed) are off by default and
  load only after consent, lazily, below the fold.

### B. Search engine integrations

- Google Search Console: site verification (meta tag or HTML file, both supported and
  admin-managed) and a service-account connection to the Search Console API for per-page
  performance data in the SEO dashboard.
- Bing Webmaster Tools: verification and API key for IndexNow and performance data.
- Credentials stored encrypted server-side; never exposed to the client bundle.

### C. Marketing pixels and tags

The owner runs paid campaigns. Admin enables each with just an ID; each is **off until an ID
is entered**:

| Tag                                                                   | Notes                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meta Pixel                                                            | with Meta domain-verification meta tag, **and** Meta Conversions API server-side — booking and contact conversions sent from the server with `event_id` deduplicated against the browser pixel (browser pixels alone lose a large share of iOS conversions) |
| Google Tag / Google Ads conversion tag                                | optionally GA4 — the first-party tracker (Phase 5) remains primary; GA4 is an optional add-on, never a replacement                                                                                                                                          |
| LinkedIn Insight Tag, Pinterest Tag, TikTok Pixel, Microsoft/Bing UET | same pattern                                                                                                                                                                                                                                                |
| Google Tag Manager                                                    | escape hatch for anything else                                                                                                                                                                                                                              |
| Custom head script / custom body script                               | with a sanitiser and an admin warning                                                                                                                                                                                                                       |

Every tag is injected by ONE `<Integrations />` server component that reads the `integrations`
table — exactly one place decides what loads.

### D. Standard conversion events

Single internal vocabulary: `booking_started`, `booking_step`, `booking_completed`,
`contact_submitted`, `whatsapp_clicked`, `call_clicked`, `testimonial_submitted`. Fired once
from the app, then fanned out to the first-party tracker, Meta Pixel/CAPI, Google Ads and any
other enabled tag, each with its own mapping. Adding a new ad platform = adding a mapping, not
touching the app.

### E. Consent

- Third-party pixels are the one thing legally requiring consent for UK and EU visitors.
- Geo-aware (edge geo headers): for UK, EU/EEA and Switzerland, no third-party pixel loads
  until the visitor accepts in a small, honest, non-dark-pattern banner. Elsewhere, tags load
  per the owner's setting, with a visible privacy link.
- The first-party tracker (Phase 5) runs cookielessly and is disclosed in the privacy policy
  rather than gated.
- Consent choices are stored, logged to `consent_log`, and re-askable from a footer link.
- **If no pixel is enabled, no banner is shown at all.**

## Working conventions

- **pnpm only.** Never npm or yarn; never touch the lockfile with another tool.
- `pnpm build` must pass with **zero TypeScript errors and zero ESLint warnings** before any
  phase is reported done. Each phase ends with a working, deployable site.
- Server Components by default; `"use client"` is the exception and needs a reason.
- Next.js App Router layout wins over any generic folder convention (see harness notes below).
- Six phases, in order — **do not start the next phase until told**:
  1. Design system, layout, home page, Supabase foundation
  2. SEO infrastructure and the geo page engine
  3. Content pages: about, astrology, vastu, services, learn, testimonials, contact
  4. Booking and calendar system
  5. Admin panel and first-party analytics
  6. SEO control backend and redirect engine
- Keep `NEEDS-REAL-DATA.md` current: every new `{{PLACEHOLDER}}` or unresearched location
  field is added there in the same change that introduces it.
- `CLAUDE.md`, `NEEDS-REAL-DATA.md`, `ROADMAP.md` and (Phase 6) `HANDOVER.md` are explicitly
  requested by the brief; no other documentation files unless asked.

### Environment and tooling notes (Phase 0 findings)

- Installed: **Next.js 16.3** (App Router, Turbopack), React 19.2, Tailwind CSS 4 (CSS-first
  config in `src/app/globals.css`, no `tailwind.config`), TypeScript 5.9 strict with
  `noUncheckedIndexedAccess`. Next 16 has breaking changes vs. training data — the
  `AGENTS.md` block at the repo root (regenerated by `next dev`) points to the docs in
  `node_modules/next/dist/docs/`; read them before touching routing, metadata or caching APIs.
- Scripts: `pnpm typecheck` (runs `next typegen` first — Next 16 route types like `LayoutProps`
  only exist after typegen/build), `pnpm lint` (max-warnings 0), `pnpm format`,
  `pnpm format:check`, `pnpm check` (all three), `pnpm build`.
- **shadcn/ui registry is unreachable from the remote build environment** (`ui.shadcn.com` is
  blocked by the egress proxy). `components.json`, `src/lib/utils.ts` (`cn`) and the runtime
  deps (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`,
  `tw-animate-css`) are set up manually. To add a component, do not run `shadcn add`; copy the
  source from a shallow clone of `github.com/shadcn-ui/ui` (`apps/v4/registry/new-york-v4/ui/`)
  into `src/components/ui/`, or hand-write it in the same style.
- Ruflo (claude-flow) is installed: 89 agent personas under `.claude/agents/`, hooks in
  `.claude/settings.json`, MCP server config in `.mcp.json`. Its runtime data (`.swarm/`,
  `ruvector.db`, `.claude-flow/data|logs|sessions`) is git-ignored. Use its personas
  (`core/coder`, `core/reviewer`, `core/tester`, `typescript-specialist`,
  `database-specialist`, `security-auditor`, `sparc/*`) when delegating phase work to subagents.
- Migrations are validated offline with PGlite (`pnpm test:migrations`, part of `pnpm test`): every SQL file
  in `supabase/migrations` is applied in order to Postgres-in-WASM with stubbed Supabase roles and `auth.uid()`,
  then RLS/policy/trigger coverage is asserted. Run it after every `drizzle-kit generate`.
- Performance decisions (Phase 1): only upright font faces are shipped/preloaded (italics synthesized);
  the mobile nav uses a native `<dialog>` (focus trap, Escape, focus return) instead of the Radix Sheet so
  the site-wide header adds ~1KB of client JS. Keep site-wide client components tiny; Radix-based primitives
  are fine inside page-level interactive islands.
- Lighthouse: `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome pnpm exec lighthouse <url>
--chrome-flags="--headless=new --no-sandbox" --form-factor=mobile` works in the remote env. Simulated
  text-LCP is inflated by Lantern (it counts all JS as pre-paint); also record `--throttling-method=provided`.
- Ruflo's background daemon (`.claude-flow/daemon.pid`) was found running after a session start even though
  `daemon.autoStart` is false; its interval workers can spawn headless Claude sessions. Stop it with
  `npx ruflo daemon stop` if it reappears — the user does not want background token spend.
- Folder layout: `src/app` (routes), `src/components/{ui,layout,seo,motifs}`, `src/lib`,
  `src/hooks`, `src/db` (Drizzle schema + client), `src/content/{locations,articles}`,
  `src/styles`, `src/types`, `supabase/{migrations,seed}`, `scripts`, `tests`.

---

# Ruflo Harness Configuration

> Harness guidance for the Ruflo (claude-flow) coordination layer. Where anything below
> conflicts with the Project Brief above, **the brief wins**. Specifically: the brief's Next.js
> App Router layout takes precedence over the generic `/src`, `/tests`, `/docs`, `/config`,
> `/scripts` folder rule (put files where Next.js and the brief expect them; still never dump
> working files at the repo root), the build command is `pnpm build` not `npm run build`, and
> the "no documentation files" rule does not apply to the files the brief explicitly requests.

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested (the brief requests `CLAUDE.md`, `NEEDS-REAL-DATA.md`, `ROADMAP.md`, `HANDOVER.md`)
- NEVER save working files or tests to the repo root — follow the Next.js App Router layout the project uses; the generic `/src`, `/tests`, `/docs`, `/config`, `/scripts` split is advisory only
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to user commits unless this project's `.claude/settings.json` has `attribution.commit` set (#2078). The Claude Code Bash tool may suggest one in its default commit-message template — ignore it. `Co-Authored-By` is semantic authorship attribution under git/GitHub convention; the tool is the facilitator, not a co-author.
- Keep files under 500 lines
- Validate input at system boundaries

## Ruflo Capability Brain & Implementation Loop

Ruflo is the coordination ledger and policy decision point. Claude Code is the
executor: after a Ruflo coordination call, continue implementing the task.

When it is registered, call
`guidance_brain({ mode: "recommend", task: "..." })` before complex Ruflo
work. Use its live registry instead of guessing tool names. Treat
`registered`, `configured`, `reachable`, `healthy`, and `authorized`
as separate facts. If the brain is unavailable, continue with the compatible
`guidance_recommend` tool, CLI discovery, and repository instructions.

Follow the returned loop:

1. Recall memory and ADR constraints.
2. Inspect source, runtime, dependencies, policy, and health.
3. Route to the smallest capable topology, agents, skills, and tools.
4. Plan acceptance criteria, safety envelope, ownership, and validation.
5. Execute in isolated scopes; the coding agent performs the work.
6. Test focused, regression, and failure paths.
7. Validate types, security, policy, compatibility, and artifacts.
8. Benchmark a source-bound candidate against a source-bound baseline.
9. Optimize measured bottlenecks without weakening safety.
10. Bind claims and evidence to exact source/build receipts.
11. Reconcile concurrent handoffs and disclose limitations.
12. Publish only through a separately authorized release gate.

### Concurrency and authority

- Never allow two writers in one worktree; give each writing agent an isolated
  worktree and explicit file ownership.
- Read-only research may run concurrently and report findings to the owner.
- Only the integration owner edits shared manifests and lockfiles or reconciles
  overlapping changes.
- A child may drop capabilities but cannot add tools, network, secrets, spend,
  concurrency, namespaces, or delegation depth.
- A lease or claim coordinates ownership; it does not authorize a side effect.
- Darwin, Flywheel, MetaHarness, memory, and neural systems may propose or
  evaluate candidates but cannot self-promote or expand their SafetyEnvelope.
- Bind tests, benchmarks, policy decisions, and release evidence to an exact
  commit or immutable dirty-worktree snapshot.

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team

```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({
  prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher",
  name: "researcher",
  run_in_background: true,
});
Agent({
  prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect",
  name: "architect",
  run_in_background: true,
});
Agent({
  prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder",
  name: "coder",
  run_in_background: true,
});
Agent({
  prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester",
  name: "tester",
  run_in_background: true,
});
Agent({
  prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer",
  name: "reviewer",
  run_in_background: true,
});

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" });
```

### Patterns

| Pattern        | Flow                  | Use When                                |
| -------------- | --------------------- | --------------------------------------- |
| **Pipeline**   | A → B → C → D         | Sequential dependencies (feature dev)   |
| **Fan-out**    | Lead → A, B, C → Lead | Independent parallel work (research)    |
| **Supervisor** | Lead ↔ workers        | Ongoing coordination (complex refactor) |

### Rules

- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning, continue independent local work; wait only when a dependency
  genuinely blocks progress
- Do not poll repeatedly — agents message back or complete automatically
- Give every writing agent an isolated worktree and a non-overlapping file scope

## Swarm & Routing

### Config

- **Topology**: hierarchical-mesh (anti-drift)
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### Agent Routing

| Task        | Agents                             | Topology     |
| ----------- | ---------------------------------- | ------------ |
| Bug Fix     | researcher, coder, tester          | hierarchical |
| Feature     | architect, coder, tester, reviewer | hierarchical |
| Refactor    | architect, coder, reviewer         | hierarchical |
| Performance | perf-engineer, coder               | hierarchical |
| Security    | security-architect, auditor        | hierarchical |

### When to Swarm

- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### 3-Tier Model Routing

| Tier | Handler              | Use Cases                                       |
| ---- | -------------------- | ----------------------------------------------- |
| 1    | Agent Booster (WASM) | Simple transforms — skip LLM, use Edit directly |
| 2    | Haiku                | Simple tasks, low complexity                    |
| 3    | Sonnet/Opus          | Architecture, security, complex reasoning       |

## Memory & Learning

### Before Any Task

```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success

```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Tools (use `ToolSearch("keyword")` to discover)

| Category      | Key Tools                                                  |
| ------------- | ---------------------------------------------------------- |
| **Memory**    | `memory_store`, `memory_search`, `memory_search_unified`   |
| **Bridge**    | `memory_import_claude`, `memory_bridge_status`             |
| **Swarm**     | `swarm_init`, `swarm_status`, `swarm_health`               |
| **Agents**    | `agent_spawn`, `agent_list`, `agent_status`                |
| **Hooks**     | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch`  |
| **Security**  | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

### Background Workers

| Worker     | When                   |
| ---------- | ---------------------- |
| `audit`    | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features  |
| `map`      | Every 5+ file changes  |
| `document` | After API changes      |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
**Security**: `security-architect`, `security-auditor`
**Performance**: `performance-engineer`, `perf-analyzer`
**Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
**GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
pnpm build && pnpm test
```

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y ruflo@latest mcp start
npx ruflo@latest doctor --fix
```

> The background `daemon` is optional. It runs interval workers that each spawn
> a headless `claude` session, so it consumes tokens continuously. Start it only
> if you want those sweeps: `npx ruflo@latest daemon start` (self-stops after 12h
> by default; `--ttl 0` to disable, `daemon status --all` to audit running daemons).

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
