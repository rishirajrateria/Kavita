# Handover — Astrologer Kavita

This is the owner's manual for the website. **Part 1 is written for you, not for a developer** —
it explains what every screen in the admin panel does and how to run the site day to day.
**Part 2 is the technical appendix**: hand it to whoever maintains the code.

Nothing on this site changes by itself. Everything below is something you control.

---

# Part 1 — Running the site

## 1. What this site is

A marketing and booking website for your practice. It has two halves:

- **The public site** — the pages visitors and Google see (home, about, astrology, vastu,
  services, learn, glossary, testimonials, contact, FAQ, legal pages, and around 400 location
  pages such as _Astrologer in Mumbai_ and _Vastu consultant in Dubai_).
- **The admin panel** — the private screens at `/admin` where you manage bookings, content,
  settings and search-engine visibility.

The site's single most important message is the **combined method**: astrology and vastu read
together as one reading. Every page is written around that. Please keep it that way — it is the
thing that distinguishes this practice from every other listing Google shows.

## 2. Signing in

1. Go to **`https://<your-domain>/admin`**.
2. Sign in with the email address that was added for you.
3. If you are signed out, you land on `/admin/login`.

There are three levels of access:

| Role       | Can do                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| **Owner**  | Everything, including adding users, changing integrations and undoing changes |
| **Editor** | Bookings, content, SEO, redirects — everything except users and undo          |
| **Viewer** | Look, but not change                                                          |

You are the owner. Add staff as editors, never as owners, unless you want them to be able to
change credentials and undo history.

**Every change you make is recorded** (who, when, before and after). See §16.

## 3. The dashboard at a glance

The sidebar has three groups.

| Group            | Screens                                                                                        | What it is for                            |
| ---------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Analytics**    | Overview, Realtime, Traffic, Geography, Pages, Behaviour, Acquisition, Technology, Conversions | Who is visiting and what they do          |
| **Manage**       | Bookings, Content, Settings, Site                                                              | The business: appointments and content    |
| **SEO & growth** | SEO, Integrations, Redirects, Indexing, Health, Audit log                                      | Being found, and a record of every change |

Some screens sit one level in, as tabs: the **SEO** screen carries **Pages · FAQs · AEO · Social**,
and the **Redirects** screen carries **Redirects · 404 log · Sitemaps · Indexing**.

The analytics are **your own**, measured by this website — no Google Analytics account is needed
and no cookies are set for it. Visitors are counted anonymously.

## 4. Bookings — the day to day

**`/admin/bookings`**

- The list shows every request with its status. Click a row for the full detail: the client's
  name, contact, birth details (where given), their question, and the timezone they are in.
- Each booking shows **both times** — yours and the client's — so you never have to do the
  arithmetic.
- Actions on a booking: **confirm**, **reschedule**, **cancel**, **mark complete**, **mark paid**,
  and **add a private note**. Every action emails the client using the templates in
  Settings → Notification templates.
- **`/admin/bookings/calendar`** is the week view. **Export** gives you a CSV, or an `.ics` file
  you can subscribe to from your phone calendar.
- Clients can reschedule or cancel themselves from the link in their confirmation email, within
  the notice period you set.

**Setting when you are available: `/admin/settings/availability`.** You set weekly rules (e.g.
Tue–Sat, 10:00–18:00) in _your_ timezone, plus exceptions for holidays and one-off days. The site
works out the correct local slot for every visitor anywhere in the world, including daylight
saving. If you change availability, already-confirmed bookings are never moved.

**Payments are off.** The fee is collected however you collect it today (bank transfer, UPI) and
you mark the booking paid by hand. When you want to take card payments online, that is a short
piece of developer work — see Part 2, §D.

## 5. Testimonials

**`/admin/content/testimonials`**

Clients can submit their experience at **`/share-your-experience`**. Nothing they write appears on
the site until you publish it.

For each one you can edit the text lightly (typos, length), choose how the person is credited
(full name, first name and city, or initials), and tick **consent given**. **Do not publish a
testimonial without consent** — and never write one yourself. Invented reviews are both dishonest
and a real risk of a Google penalty; the site is deliberately built so that star ratings and review
counts only appear when genuine, attributable ones exist.

## 6. Services and prices

**`/admin/content/services`**

Each service has a name, a short summary, the full description, the session length, and a price
(or "on request"). Prices can be set in INR, USD, GBP and AED.

- Every service page must say whether it is **astrology-led, vastu-led, or integrated**. That
  field is on the edit screen. Please keep it filled in.
- **The web address (slug) of a service is permanent.** If you do change it, the site creates a
  redirect from the old address automatically so nobody hits a dead link — but the old address
  loses a little of its Google standing, so only change a slug for a good reason.

## 7. Locations and the research fields

**`/admin/content/locations`**

This is the engine behind the ~400 location pages. Each city, state and country has a record with
researched, location-specific facts: the timezone and the hours that work for a live session, real
landmarks or neighbourhoods, the regional calendar or chart style, two or three climate and
housing facts that genuinely change vastu advice there, the concerns clients from that place bring,
and three to five local FAQs.

**A location page is only published when its record is complete.** That is deliberate. Four hundred
pages that differ only by the city name is the single fastest way to be classified as spam by
Google; the site refuses to publish a thin one. If a page is missing, the record is incomplete —
the editor shows you exactly which fields are empty.

The **client concerns** field currently holds careful generalisations written by the build team from
each place's verifiable context — never a claim about your actual clients. Please read them and
rewrite them in your own words as you get real experience with each market. Every one is listed in
`NEEDS-REAL-DATA.md`.

## 8. The SEO editor

**`/admin/seo`** lists every page. Click one (or go to `/admin/seo/<page>`) to control:

- **Title** and **meta description** — what Google shows in its results. The editor previews the
  result exactly as Google renders it, and warns when the title will be cut off.
- **H1**, **canonical address**, and whether the page should be indexed at all.
- **Social cards** — the picture and text shown when the page is shared on WhatsApp, X, LinkedIn
  or Facebook. There is a live preview of each.
- A **citability check** — how quotable the page is for AI assistants (see §10).

If you leave a field empty, the page keeps the title and description the site generates for it.
The editor only overrides.

## 9. FAQs

**`/admin/faqs`** holds every question and answer, and lets you attach a set of them to a page or to
a whole family of pages (for instance every `/astrologer/india/*` page). The answers are also
published as structured data, which is how they can appear directly in Google's results.

Write answers that stand on their own — a person (or an AI) reading the answer alone should
understand it without the question above it.

## 10. The AEO panel — being quoted by ChatGPT, Gemini and Siri

**`/admin/aeo`**

Answer engines quote pages that are easy to quote. This screen is about that.

- **Answer blocks.** Each question heading on a page is followed by a short, self-contained
  answer of roughly 40–60 words. The panel counts the words and flags answers that start with
  "It" or "This" (a model cannot quote those — it does not know what "it" is) or that never name
  the subject. Aim for _"A vastu consultation for a Dubai apartment with Astrologer Kavita…"_, not
  _"It usually costs…"_.
  An answer saved here replaces the one written into that page the next time the page is
  requested — nothing to redeploy. It is matched on the exact route plus the id of the section
  holding the question (`opening`, `tradition`, `faq`, `book`, and so on; the ids are in the page
  source and are the anchors the contents list links to). Remove the override and the page goes
  back to its own words.
- **Key facts.** The compact fact list near the top of each location and service page. Assistants
  lift these nearly word for word, so keep them accurate. A fact saved here whose label matches
  one already on the page replaces that value; a new label is added to the end of the list.
- **`llms.txt` / `/for-ai`.** Plain, factual, machine-readable summaries of the practice. Edit
  the preamble and choose which pages are included.
- **AI crawler toggles.** One switch per bot. Read the note beside each: some of them
  (Google-Extended, GPTBot, Applebot-Extended, CCBot) control whether your content may be used to
  _train_ future models, not just whether it can be _retrieved and cited today_. Allowing them
  maximises the chance future assistants simply know who you are; it also means your words become
  training data. **That is a business decision and it is yours.** `Applebot` is the one that feeds
  Siri and Spotlight — keep that one allowed either way.

## 11. Social cards and images

**`/admin/social`** sets the default share picture and wording per type of page, and holds an image
library you can upload to. Per-page overrides live in the SEO editor (§8).

## 12. Redirects and the 404 list

**`/admin/redirects`** — when a page's address changes, a redirect sends the old address to the new
one so visitors and Google are not lost. Most are created for you automatically when you change a
slug. You can add your own (including from a printed flyer's short link), import and export them as
a spreadsheet, and the site refuses to save a redirect that would loop.

**`/admin/not-found-log`** — every address someone asked for that does not exist, most-requested
first. If you see a real page's old address here, click **create redirect** beside it and it is
fixed in one step. It is worth a glance once a month.

## 13. Site health

**`/admin/health`**

Press **Run crawl** and the site reads itself the way a search engine would, then lists everything
worth fixing: missing or duplicated titles and descriptions, pages with no heading or two, broken
internal links, images with no alternative text, missing structured data, thin pages, pages missing
from the sitemap, orphan pages nothing links to, redirect chains, and low citability scores.

Findings are grouped into **errors** (fix these), **warnings** (worth fixing) and **notes**.
**Every finding has an "Open editor" button that takes you to the exact screen that fixes it.**

A crawl of a large site takes more than one pass: if it pauses, press **Continue crawl**. It also
runs by itself **every Monday at 03:30 UTC**, so the list is never more than a week stale.

## 14. Sitemaps and indexing

- **`/admin/sitemaps`** — which sections are listed in the sitemap files Google reads, with a live
  preview of each file.
- **`/admin/indexing`** — search performance. Once Google Search Console and Bing are connected
  (§15), this shows impressions, clicks and average position per page beside your own visitor
  numbers. You can also submit changed pages to Bing instantly, which matters more than usual here
  because ChatGPT's search leans on Bing's index.

## 15. Integrations — pixels, tags and consent

**`/admin/integrations`**

One card per service. Each one is **off until you enter its ID** — nothing loads on the site
otherwise.

| Service                                    | What it is for                                    |
| ------------------------------------------ | ------------------------------------------------- |
| Google Search Console / Bing Webmaster     | Verifying the site and reading search performance |
| Meta Pixel + Conversions API               | Facebook and Instagram ads                        |
| Google Tag / Google Ads / GA4              | Google ads and (optional) Google Analytics        |
| LinkedIn, Pinterest, TikTok, Microsoft UET | The same, per platform                            |
| Google Tag Manager                         | An escape hatch for anything else                 |

Two things to understand before you switch any of these on:

1. **Consent.** For visitors in the UK, the EU/EEA and Switzerland, advertising pixels may not load
   until the visitor agrees. The site handles this for you: it detects the visitor's region and
   shows a small, honest banner with **Accept** and **Reject** given equal weight. Elsewhere, tags
   load according to your setting. **If you have no pixel enabled, no banner is shown at all** —
   turning on your first pixel is what makes the banner appear for European visitors.
2. **Conversions API.** For Meta, the site also reports bookings and enquiries **from the server**,
   matched to the browser pixel so nothing is double-counted. This is worth switching on: browser
   pixels alone silently lose a large share of iPhone conversions.

Your own analytics (the Analytics group in the sidebar) are separate. They are cookieless and
first-party, are disclosed in the privacy policy rather than gated behind the banner, and keep
working whether or not anyone accepts.

## 16. The audit log and undo

**`/admin/audit`**

Every change made in the admin panel is listed: who, when, what changed, and a field-by-field
**before and after**. Passwords and API keys are never stored in the log.

For most kinds of record you also get **Revert** — one click puts the old values back. The revert
is itself recorded, so you can always see that it happened. Only an owner can revert. Some things
cannot be undone this way (bookings, and bulk changes made to many rows at once) — those say so
instead of offering a button.

## 17. What not to change

- **Do not delete the disclaimer, privacy or terms pages, or the footer link to them.** They are a
  legal requirement, and the disclaimer is what makes clear that readings are traditional guidance,
  not medical, legal or financial advice.
- **Do not write copy that promises outcomes** — no guaranteed results, no cures, no "100%
  accurate". The site is deliberately written to be confident about the practice and honest about
  what it is.
- **Do not invent testimonials, statistics, client numbers or credentials.** Anything not yet
  supplied is marked `{{LIKE THIS}}` and listed in `NEEDS-REAL-DATA.md`.
- **Do not change page addresses casually.** A redirect will be made, but the page restarts part of
  its climb in Google.
- **Do not paste a script into the "custom head script" box** unless you know exactly what it is.
  It runs on every page for every visitor.
- **Do not change the encryption key** (`DATA_ENCRYPTION_KEY`) — client birth details are encrypted
  with it and would become unreadable.

## 18. Where to get help

- **`NEEDS-REAL-DATA.md`** in the code repository lists every fact still waiting on you.
- **`CLAUDE.md`** is the full project brief — the reasoning behind every decision.
- **`ROADMAP.md`** records what was built in each phase and what is deliberately left for later.
- If something on the public site looks wrong, check **`/admin/health`** first; it usually names
  the problem and links to the fix.

---

# Part 2 — Technical appendix

## A. Stack and layout

Next.js 16 (App Router, Turbopack, React 19) · TypeScript strict · Tailwind CSS 4 (CSS-first
tokens in `src/app/globals.css` + `src/styles/tokens.css`) · Drizzle ORM over Supabase Postgres ·
Resend for email · deployed on Vercel · **pnpm only**.

```
src/app          routes (public, /admin, /api)
src/components   ui/ layout/ seo/ motifs/ admin/ …
src/lib          domain logic: admin, analytics, booking, consent, crypto, data, geo,
                 integrations, markdown, notifications, payments, redirects, search-console,
                 seo, seo-health, storage, validation
src/db           Drizzle schema + client        src/content  locations, articles, glossary
supabase/        migrations + seed              scripts/     validate-content, seed
tests/           tsx test suites (see §G)
```

## B. Commands

| Command                           | What it does                                                |
| --------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                        | Development server                                          |
| `pnpm check`                      | `typecheck` + `lint` (max-warnings 0) + `format:check`      |
| `pnpm test`                       | Every test suite, in order                                  |
| `pnpm validate:content`           | Location research gate (also runs on `prebuild`)            |
| `pnpm build`                      | Production build — must be clean before any deploy          |
| `pnpm db:generate` / `db:migrate` | Drizzle migration generate / apply                          |
| `pnpm test:migrations`            | Applies every migration to Postgres-in-WASM and asserts RLS |

## C. Environment variables

Set these in Vercel (Project → Settings → Environment Variables). Only `NEXT_PUBLIC_*` reach the
browser; nothing else may ever be given that prefix.

| Variable                                                                     | Purpose                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                       | Canonical origin, e.g. `https://astrologerkavita.com`                                                               |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                  | Supabase client (public by design)                                                                                  |
| `SUPABASE_DB_URL`                                                            | Postgres connection string (pooled) for the server                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`                                                  | Server-only: private Storage buckets                                                                                |
| `DATA_ENCRYPTION_KEY`, `DATA_ENCRYPTION_KEY_ID`, `DATA_ENCRYPTION_KEYS`      | AES-256-GCM for birth details and stored credentials; `KEYS` is a comma list `k1:<base64>,k2:<base64>` for rotation |
| `BOOKING_TOKEN_SECRET`                                                       | Signs the client self-service links                                                                                 |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_NOTIFY_TO`                            | Transactional email                                                                                                 |
| `CRON_SECRET`                                                                | Bearer token every `/api/cron/*` route requires                                                                     |
| `IP_HASH_SALT`                                                               | Daily-rotated visitor hashing (never a raw IP)                                                                      |
| `INDEXNOW_KEY`, `INDEXNOW_SUBMIT_SECRET`                                     | IndexNow submissions to Bing                                                                                        |
| `REDIRECT_REFRESH_SECRET`                                                    | Authorises `POST /api/redirects/refresh`                                                                            |
| `PAYMENTS_ENABLED`, `PAYMENT_PROVIDER`, `RAZORPAY_*`, `STRIPE_*`             | Payment seam — see §D                                                                                               |
| `WHATSAPP_NOTIFICATIONS_ENABLED`, `ANALYTICS_DISABLED`, `SHOW_DESIGN_SYSTEM` | Feature switches                                                                                                    |
| `ADMIN_DEV_BYPASS`                                                           | **Non-production only.** Synthetic owner session for local review                                                   |

**Add these to `.env.example` by hand.** The file became permission-blocked for the build tooling
part-way through the project, so five variables are documented here instead of being listed there:

```dotenv
REDIRECT_REFRESH_SECRET=          # bearer token for POST /api/redirects/refresh (redirect cache)
DATA_ENCRYPTION_KEY_ID=k1         # id of the current encryption key
DATA_ENCRYPTION_KEYS=             # rotation list: k1:<base64>,k2:<base64>; DATA_ENCRYPTION_KEY stays the current key
ANALYTICS_DISABLED=false          # set true to stop first-party analytics collection
ADMIN_DEV_BYPASS=false            # LOCAL ONLY — never set this in production; it grants an owner session with no login
```

## D. Connecting the outside world

- **Supabase** — create the project, run `pnpm db:migrate`, then `pnpm db:seed`. Set the four
  Supabase variables above. Storage buckets: **`floor-plans`** (private — client uploads) and
  **`og-library`** (public — share images). RLS is on for every table; the service role is only
  ever used server-side.
- **Vercel** — import the repo, set the variables, deploy. `vercel.json` carries the cron
  schedule; Vercel reads it on deploy.
- **Resend** — verify the sending domain, create an API key, set `RESEND_API_KEY` and `EMAIL_FROM`.
- **Google Search Console** — `/admin/integrations` → verification tag (meta or HTML file, both
  supported and served from the database). For performance data, create a service account with
  Search Console read access and paste its JSON key; it is encrypted at rest.
- **Bing Webmaster Tools** — verification plus an API key; the same card also drives IndexNow.
- **Meta** — Pixel ID, domain-verification tag, and a Conversions API access token with an optional
  `test_event_code` for verifying the setup.

**Payments (`CLAUDE.md` §11) are a seam, not a feature.** `src/lib/payments/` already defines the
`PaymentProvider` interface, a registry, the `payments` table and a signature-verifying webhook
route. Adding Razorpay or Stripe is: write the provider class, register it, implement
`verifyWebhook` over the _raw_ body, map the events, set the keys, flip `PAYMENTS_ENABLED=true`.
`CLAUDE.md` §11 has the exact request shapes, the event→status table and the test checklist.

## E. Scheduled jobs (`vercel.json`)

| Path                         | Schedule (UTC)   | What it does                                                    |
| ---------------------------- | ---------------- | --------------------------------------------------------------- |
| `/api/cron/reminders`        | every 15 minutes | Booking reminder emails                                         |
| `/api/cron/analytics-rollup` | hourly at :15    | Rolls raw analytics into daily aggregates; 90-day raw retention |
| `/api/cron/seo-health`       | Mondays 03:30    | One budgeted segment of the SEO health crawl                    |

All three require `Authorization: Bearer $CRON_SECRET`. A crawl that does not finish inside its
time budget is stored as `paused` with its cursor and resumes on the next firing or from the
**Continue crawl** button.

## F. Notes for whoever maintains this

- **Server Components by default.** `"use client"` needs a reason, and never on a component that
  holds primary page copy — every public page must render its full text with JavaScript disabled.
  That is the single most important technical property of this site for AI-engine visibility.
- **No content in `useEffect`, ever.** All writes go through route handlers; client components
  never touch the database.
- **`src/lib/routes.ts` is the route registry.** Sitemaps, `robots.txt`, the SEO editor's page list
  and the health crawler all read it. A new public route belongs there.
- **Location data is data.** Adding 500 more cities is more rows in `src/content/locations/`, not
  component changes. `pnpm validate:content` enforces the completeness, word-count and 60%
  similarity rules and runs on `prebuild`.
- **Audit everything.** Admin route handlers wrap `adminRoute(handler, { role })`, which writes an
  `admin_audit_log` row with redacted before/after. `src/lib/admin/revert.ts` holds the registry of
  entity types that can be reverted — add new tables there rather than writing bespoke undo code.
- **shadcn/ui's registry is unreachable from the build environment.** Copy component source from
  the upstream repo by hand instead of running `shadcn add`.

## G. Tests

`pnpm test` runs, in order: content seed, consultation windows, migrations (PGlite — every
migration applied to Postgres-in-WASM with RLS, policy and trigger assertions), schema, SEO
plumbing, forms, booking, learn, notifications, analytics, admin management, admin, SEO health,
redirects, integrations and SEO control. `pnpm test:booking-ui` is run separately. They are plain
`tsx` scripts — no test framework — and each suite has a `run.ts` entry point. Add new suites
there and to the `test` chain in `package.json`.
