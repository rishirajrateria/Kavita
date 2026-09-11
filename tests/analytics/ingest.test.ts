/** Ingest: batch parsing, geo headers, UA parsing, bot detection, visitor hash, DB writes. */
import { eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { analyticsEvents, analyticsPageviews, analyticsSessions } from "@/db/schema";
import { geoFromHeaders } from "@/lib/analytics/geo";
import { dailySalt, visitorHash } from "@/lib/analytics/hash";
import { ingestBatch, type IngestContext } from "@/lib/analytics/ingest";
import { isGeoPagePath, normalisePath } from "@/lib/analytics/paths";
import { classifyChannel, referrerHost } from "@/lib/analytics/referrer";
import { parseBatch } from "@/lib/analytics/schema";
import { hasHeadlessMarkers, isBotUserAgent, parseUserAgent } from "@/lib/analytics/ua";

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
const SAFARI_IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";

export function sampleBatch(sid = "0123456789abcdef", key = "fedcba9876543210") {
  return {
    v: 1,
    sid,
    ns: true,
    ref: "https://www.google.com/search?q=astrologer+mumbai",
    sw: 390,
    sh: 844,
    vw: 390,
    vh: 660,
    conn: "4g",
    ev: [
      {
        t: "pv",
        k: key,
        p: "/astrologer/india/maharashtra/mumbai?utm_source=x#top",
        ti: "Astrologer in Mumbai",
        ts: Date.now(),
      },
      { t: "sd", k: key, p: "/astrologer/india/maharashtra/mumbai", d: 50, ts: Date.now() },
      {
        t: "e",
        n: "click",
        p: "/astrologer/india/maharashtra/mumbai",
        pr: { sel: "main>a.btn", txt: "Book", x: 50.5, y: 20, i: 1 },
        ts: Date.now(),
      },
      {
        t: "e",
        n: "whatsapp_clicked",
        p: "/astrologer/india/maharashtra/mumbai",
        pr: { placement: "cta" },
        id: "evt-0000000001",
        ts: Date.now(),
      },
      {
        t: "pe",
        k: key,
        p: "/astrologer/india/maharashtra/mumbai",
        tp: 12000,
        sd: 75,
        ts: Date.now(),
      },
    ],
  };
}

export function context(overrides: Partial<IngestContext> = {}): IngestContext {
  return {
    visitorHash: "a".repeat(32),
    country: "IN",
    region: "Maharashtra",
    city: "Mumbai",
    deviceType: "mobile",
    os: "Android",
    browser: "Chrome",
    isBot: false,
    siteHost: "astrologerkavita.example",
    now: new Date("2026-09-11T10:00:00Z"),
    ...overrides,
  };
}

export async function run() {
  // Parsing
  check(parseBatch(JSON.stringify(sampleBatch())) !== null, "valid batch parses");
  equal(parseBatch("not json"), null, "garbage is rejected");
  equal(parseBatch(""), null, "empty body is rejected");
  equal(
    parseBatch(JSON.stringify({ v: 2, sid: "x", ev: [] })),
    null,
    "unknown version is rejected",
  );
  equal(parseBatch(JSON.stringify({ ...sampleBatch(), ev: [] })), null, "empty batch is rejected");
  equal(
    parseBatch(JSON.stringify({ ...sampleBatch(), sid: "not-hex!" })),
    null,
    "bad sid is rejected",
  );
  const evil = { ...sampleBatch(), ev: [{ t: "e", n: "drop_table", p: "/", pr: {}, ts: 1 }] };
  equal(parseBatch(JSON.stringify(evil)), null, "unknown event names are rejected");
  const tooMany = { ...sampleBatch(), ev: new Array(21).fill(sampleBatch().ev[0]) };
  equal(parseBatch(JSON.stringify(tooMany)), null, "batches over 20 events are rejected");

  // Geo
  const geo = geoFromHeaders(
    new Headers({
      "x-vercel-ip-country": "ae",
      "x-vercel-ip-country-region": "Dubayy",
      "x-vercel-ip-city": "Dubai%20Marina",
    }),
  );
  equal(
    `${geo.country}|${geo.region}|${geo.city}`,
    "AE|Dubayy|Dubai Marina",
    "geo headers decoded and upper-cased",
  );
  equal(geoFromHeaders(new Headers()).country, null, "missing geo → null");
  equal(
    geoFromHeaders(new Headers({ "x-vercel-ip-country": "XYZ" })).country,
    null,
    "malformed country → null",
  );

  // UA + bots
  equal(
    JSON.stringify(parseUserAgent(CHROME_ANDROID)),
    JSON.stringify({ deviceType: "mobile", os: "Android", browser: "Chrome", isBot: false }),
    "Android Chrome",
  );
  equal(
    JSON.stringify(parseUserAgent(SAFARI_IPAD)),
    JSON.stringify({ deviceType: "tablet", os: "iOS", browser: "Safari", isBot: false }),
    "iPad Safari",
  );
  equal(
    JSON.stringify(parseUserAgent(EDGE_WINDOWS)),
    JSON.stringify({ deviceType: "desktop", os: "Windows", browser: "Edge", isBot: false }),
    "Windows Edge",
  );
  check(
    isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    "Googlebot is a bot",
  );
  check(
    isBotUserAgent("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0 Safari/537.36"),
    "HeadlessChrome is a bot",
  );
  check(isBotUserAgent("curl/8.4.0"), "curl is a bot");
  check(isBotUserAgent(null) && isBotUserAgent(""), "missing UA is treated as a bot");
  equal(parseUserAgent("GPTBot/1.0").deviceType, "bot", "AI crawlers are bots");
  check(
    hasHeadlessMarkers(new Headers({ "sec-fetch-site": "cross-site" })),
    "cross-site beacon is flagged",
  );
  check(
    !hasHeadlessMarkers(
      new Headers({ "sec-fetch-site": "same-origin", "sec-fetch-mode": "no-cors" }),
    ),
    "same-origin beacon passes",
  );

  // Hash
  const d1 = new Date("2026-09-11T23:59:00Z");
  const d2 = new Date("2026-09-12T00:01:00Z");
  const h1 = visitorHash("203.0.113.9", CHROME_ANDROID, d1, "root-salt");
  equal(h1.length, 32, "hash is 32 hex chars");
  equal(
    visitorHash("203.0.113.9", CHROME_ANDROID, d1, "root-salt"),
    h1,
    "hash is stable within a day",
  );
  check(
    visitorHash("203.0.113.9", CHROME_ANDROID, d2, "root-salt") !== h1,
    "hash rotates at the UTC day boundary",
  );
  check(
    visitorHash("203.0.113.10", CHROME_ANDROID, d1, "root-salt") !== h1,
    "hash depends on the IP",
  );
  check(dailySalt(d1, "root-salt") !== dailySalt(d2, "root-salt"), "daily salt differs per day");
  check(!h1.includes("203"), "hash contains no IP fragment");

  // Paths and referrers
  equal(
    normalisePath("/book/manage/Ab3dEf9hIjKlMnOpQrStUvWxYz0123456789?x=1#h"),
    "/book/manage/:token",
    "tokens masked, query dropped",
  );
  equal(
    normalisePath("https://example.com/about/"),
    "/about",
    "absolute URLs reduced to the path, trailing slash dropped",
  );
  equal(
    normalisePath("/bookings/1b4e28ba-2fa1-11d2-883f-0016d3cca427"),
    "/bookings/:token",
    "uuids masked",
  );
  equal(normalisePath("about"), "/about", "leading slash added");
  equal(normalisePath(""), "/", "empty → root");
  check(isGeoPagePath("/vastu-consultant/india") && !isGeoPagePath("/vastu"), "geo page detection");
  equal(
    referrerHost("https://www.google.com/search?q=x"),
    "google.com",
    "referrer host strips www",
  );
  equal(
    referrerHost("https://www.bing.com/chat?q=x"),
    "bing.com/chat",
    "Bing chat keeps its path marker",
  );
  equal(referrerHost("android-app://com.google.android.gm/"), null, "non-http referrers dropped");
  equal(
    classifyChannel({ referrerHost: "chatgpt.com", siteHost: "site.example" }),
    "ai",
    "AI channel",
  );
  equal(
    classifyChannel({ referrerHost: "google.co.in", siteHost: "site.example" }),
    "search",
    "search channel",
  );
  equal(
    classifyChannel({ referrerHost: "instagram.com", siteHost: "site.example" }),
    "social",
    "social channel",
  );
  equal(
    classifyChannel({ referrerHost: null, siteHost: "site.example" }),
    "direct",
    "direct channel",
  );
  equal(
    classifyChannel({ referrerHost: "site.example", siteHost: "site.example" }),
    "direct",
    "self-referral is direct",
  );
  equal(
    classifyChannel({
      referrerHost: "google.com",
      siteHost: "site.example",
      utmCampaign: "diwali",
    }),
    "campaign",
    "UTM wins",
  );
  equal(
    classifyChannel({ referrerHost: "blog.example", siteHost: "site.example" }),
    "referral",
    "referral channel",
  );

  // Database writes
  const { db, close } = await createTestDb();
  try {
    const batch = parseBatch(JSON.stringify(sampleBatch()));
    if (!batch) throw new Error("sample batch did not parse");
    const first = await ingestBatch(db, batch, context());
    equal(first.pageviews, 1, "one pageview written");
    equal(first.events, 2, "two events written");
    const [session] = await db
      .select()
      .from(analyticsSessions)
      .where(eq(analyticsSessions.id, first.sessionId));
    equal(session?.entryPath, "/astrologer/india/maharashtra/mumbai", "entry path sanitised");
    equal(session?.referrerHost, "google.com", "referrer host derived");
    equal(session?.channel, "search", "channel classified");
    equal(session?.country, "IN", "geo stored");
    equal(session?.pageviewCount, 1, "pageview count maintained");
    equal(session?.screenW, 390, "screen stored");
    const [pv] = await db
      .select()
      .from(analyticsPageviews)
      .where(eq(analyticsPageviews.sessionId, first.sessionId));
    equal(pv?.scrollDepthMax, 75, "scroll depth takes the greatest value");
    equal(pv?.timeOnPageMs, 12000, "time on page from the leave beacon");
    equal(pv?.isEntry, true, "first pageview is the entry");
    equal(pv?.isExit, true, "…and the exit until another arrives");
    equal(pv?.title, "Astrologer in Mumbai", "title stored");

    // Same batch again (retried beacon): nothing doubles.
    const again = await ingestBatch(db, batch, context({ now: new Date("2026-09-11T10:00:30Z") }));
    equal(again.sessionId, first.sessionId, "same visitor + sid → same session");
    equal(again.pageviews, 0, "duplicate pageview ignored");
    equal(
      again.events,
      1,
      "duplicate conversion (event id) ignored; behaviour click without id is kept",
    );
    const [s2] = await db
      .select()
      .from(analyticsSessions)
      .where(eq(analyticsSessions.id, first.sessionId));
    equal(s2?.pageviewCount, 1, "pageview count unchanged");
    equal(s2?.durationMs, 30000, "duration follows last_seen - started");

    // Second pageview in the same session moves the exit.
    const second = {
      ...sampleBatch(),
      ns: false,
      ev: [{ t: "pv", k: "00000000000000aa", p: "/book", ts: Date.now() }],
    };
    const parsed2 = parseBatch(JSON.stringify(second));
    if (!parsed2) throw new Error("second batch did not parse");
    await ingestBatch(db, parsed2, context({ now: new Date("2026-09-11T10:01:00Z") }));
    const pvs = await db
      .select()
      .from(analyticsPageviews)
      .where(eq(analyticsPageviews.sessionId, first.sessionId));
    equal(pvs.length, 2, "two pageviews in the session");
    equal(
      pvs
        .filter((p) => p.isExit)
        .map((p) => p.path)
        .join(),
      "/book",
      "exit moved to the latest pageview",
    );
    equal(pvs.filter((p) => p.isEntry).length, 1, "still one entry");
    const [s3] = await db
      .select()
      .from(analyticsSessions)
      .where(eq(analyticsSessions.id, first.sessionId));
    equal(s3?.exitPath, "/book", "session exit path updated");

    // A different visitor hash with the same sid is a different session.
    const other = await ingestBatch(db, batch, context({ visitorHash: "b".repeat(32) }));
    check(other.sessionId !== first.sessionId, "sid is scoped by visitor hash");

    // Bot sessions are stored flagged, and excluded downstream (rollup test).
    const bot = await ingestBatch(
      db,
      parsed2,
      context({ visitorHash: "c".repeat(32), isBot: true, deviceType: "bot" }),
    );
    const [botRow] = await db
      .select()
      .from(analyticsSessions)
      .where(eq(analyticsSessions.id, bot.sessionId));
    equal(botRow?.isBot, true, "bot flag stored");
    const events = await db.select().from(analyticsEvents);
    check(
      events.every((e) => JSON.stringify(e.props).length < 400),
      "event props stay small",
    );
  } finally {
    await close();
  }
}
