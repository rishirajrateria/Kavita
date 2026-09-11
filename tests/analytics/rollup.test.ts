/** Rollup correctness, idempotency and retention on PGlite. */
import { and, eq } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import {
  analyticsDailyRollup,
  analyticsEvents,
  analyticsPageviews,
  analyticsSessions,
} from "@/db/schema";
import { ingestBatch } from "@/lib/analytics/ingest";
import {
  applyRetention,
  daysAwaitingRollup,
  rollupDay,
  runRollup,
  sessionsExist,
} from "@/lib/analytics/rollup";
import { parseBatch } from "@/lib/analytics/schema";
import { context, sampleBatch } from "./ingest.test";

function batch(sid: string, key: string, path: string, extra: Record<string, unknown>[] = []) {
  const b = sampleBatch(sid, key);
  b.ev = [
    { t: "pv", k: key, p: path, ti: "T", ts: Date.now() },
    { t: "pe", k: key, p: path, tp: 5000, sd: 50, ts: Date.now() },
    ...(extra as typeof b.ev),
  ];
  const parsed = parseBatch(JSON.stringify(b));
  if (!parsed) throw new Error(`batch for ${sid} did not parse`);
  return parsed;
}

export async function run() {
  const { db, close } = await createTestDb();
  try {
    const day = "2026-09-10";
    const at = (h: number) => new Date(`${day}T${String(h).padStart(2, "0")}:00:00Z`);
    // Visitor A: two pageviews, a booking started + step + completed.
    await ingestBatch(
      db,
      batch("000000000000000a", "00000000000000a1", "/astrologer/india/maharashtra/mumbai", [
        { t: "e", n: "booking_started", p: "/book", pr: {}, id: "a-started-0001", ts: Date.now() },
        {
          t: "e",
          n: "booking_step",
          p: "/book",
          pr: { step: 2 },
          id: "a-step-000002",
          ts: Date.now(),
        },
        {
          t: "e",
          n: "booking_completed",
          p: "/book",
          pr: {},
          id: "a-completed-01",
          ts: Date.now(),
        },
      ]),
      context({ visitorHash: "a".repeat(32), now: at(9) }),
    );
    await ingestBatch(
      db,
      batch("000000000000000a", "00000000000000a2", "/book"),
      context({ visitorHash: "a".repeat(32), now: at(9) }),
    );
    // Visitor B: one pageview (bounce), from the US on desktop via ChatGPT.
    await ingestBatch(
      db,
      {
        ...batch("000000000000000b", "00000000000000b1", "/vastu", [
          {
            t: "e",
            n: "click",
            p: "/vastu",
            pr: { sel: "main>p", txt: "", x: 40, y: 30, i: 0 },
            ts: Date.now(),
          },
        ]),
        ref: "https://chatgpt.com/",
      },
      context({
        visitorHash: "b".repeat(32),
        country: "US",
        region: "New Jersey",
        city: "Edison",
        deviceType: "desktop",
        os: "Windows",
        browser: "Edge",
        now: at(12),
      }),
    );
    // A bot session that must not count.
    await ingestBatch(
      db,
      batch("000000000000000c", "00000000000000c1", "/"),
      context({ visitorHash: "c".repeat(32), isBot: true, deviceType: "bot", now: at(13) }),
    );
    // Old session (100 days ago) for retention.
    const old = await ingestBatch(
      db,
      batch("000000000000000d", "00000000000000d1", "/about"),
      context({ visitorHash: "d".repeat(32), now: new Date("2026-06-01T00:00:00Z") }),
    );

    const pending = await daysAwaitingRollup(db);
    equal(
      pending.join(","),
      "2026-06-01,2026-09-10",
      "days with raw data and no rollup, oldest first",
    );

    const written = await rollupDay(db, day);
    check(written > 0, "rollup wrote rows");
    const site = await db
      .select()
      .from(analyticsDailyRollup)
      .where(and(eq(analyticsDailyRollup.day, day), eq(analyticsDailyRollup.dim, "site")));
    equal(site.length, 1, "one site row");
    equal(site[0]?.sessions, 2, "site sessions exclude the bot");
    equal(site[0]?.visitors, 2, "site visitors");
    equal(site[0]?.pageviews, 3, "site pageviews");
    equal(site[0]?.bounces, 1, "one bounced session");
    equal(site[0]?.scroll50, 3, "scroll ≥50 counted per pageview");
    equal(site[0]?.conversions.booking_completed, 1, "conversions in the site row");

    const rows = (dim: string) =>
      db
        .select()
        .from(analyticsDailyRollup)
        .where(and(eq(analyticsDailyRollup.day, day), eq(analyticsDailyRollup.dim, dim as "site")));
    const countries = await rows("country");
    equal(
      countries
        .map((r) => `${r.key}:${r.sessions}`)
        .sort()
        .join(","),
      "IN:1,US:1",
      "country rows",
    );
    const cities = await rows("city");
    check(
      cities.some((r) => r.key === "US/New Jersey/Edison"),
      "city keys are country/region/city",
    );
    const referrers = await rows("referrer");
    check(
      referrers.some((r) => r.key === "chatgpt.com" && r.sessions === 1),
      "AI referrer row",
    );
    const sources = await rows("source");
    equal(
      sources
        .map((r) => r.key)
        .sort()
        .join(","),
      "ai,search",
      "channel rows",
    );
    const paths = await rows("path");
    const book = paths.find((r) => r.key === "/book");
    equal(book?.pageviews, 1, "path pageviews");
    equal(book?.exits, 1, "/book is the exit of session A");
    equal(book?.entries, 0, "/book is not an entry");
    equal(
      book?.conversions.booking_completed,
      1,
      "conversions attributed to the page they fired on",
    );
    const geo = await rows("geo_page");
    equal(
      geo.map((r) => r.key).join(),
      "/astrologer/india/maharashtra/mumbai",
      "geo_page rows only for geo paths",
    );
    equal(geo[0]?.entries, 1, "geo page entry counted");
    const funnel = await rows("funnel_step");
    equal(
      funnel
        .map((r) => `${r.key}:${r.sessions}`)
        .sort()
        .join(","),
      "completed:1,started:1,step:2:1",
      "funnel steps",
    );
    const events = await rows("event");
    check(
      events.some((r) => r.key === "click" && r.conversions.click === 1),
      "behaviour events counted in the event dim",
    );
    const devices = await rows("device");
    check(!devices.some((r) => r.key === "bot"), "no bot device row");

    // Idempotent: run again, same number of rows, same values.
    const before = await db.select().from(analyticsDailyRollup);
    const again = await rollupDay(db, day);
    equal(again, written, "second run writes the same row count");
    const after = await db.select().from(analyticsDailyRollup);
    equal(after.length, before.length, "no duplicate rollup rows");
    const norm = (list: typeof before) =>
      JSON.stringify(
        list
          .map(({ id: _id, createdAt: _c, updatedAt: _u, ...rest }) => rest)
          .sort((a, b) => `${a.dim}${a.key}`.localeCompare(`${b.dim}${b.key}`)),
      );
    equal(norm(after), norm(before), "second run leaves identical values");

    // Retention: 90-day cutoff removes the old session and its children.
    const retention = await applyRetention(db, new Date("2026-09-11T00:00:00Z"));
    equal(retention.sessionsDeleted, 1, "one old session deleted");
    equal(await sessionsExist(db, [old.sessionId]), 0, "old session gone");
    const orphanPvs = await db
      .select()
      .from(analyticsPageviews)
      .where(eq(analyticsPageviews.sessionId, old.sessionId));
    equal(orphanPvs.length, 0, "pageviews cascade");
    const orphanEvents = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.sessionId, old.sessionId));
    equal(orphanEvents.length, 0, "events cascade");
    const oldRollup = await db
      .select()
      .from(analyticsDailyRollup)
      .where(eq(analyticsDailyRollup.day, "2026-06-01"));
    equal(
      oldRollup.length,
      0,
      "a day that was never rolled stays absent — cron rolls before it deletes",
    );

    // The cron body: today + yesterday + pending, then retention.
    const result = await runRollup(db, new Date("2026-09-11T01:00:00Z"));
    equal(result.days.join(","), "2026-09-10,2026-09-11", "cron rolls yesterday and today");
    const remaining = await db.select().from(analyticsSessions);
    equal(remaining.length, 3, "cron retention keeps recent sessions (incl. the bot row)");
  } finally {
    await close();
  }
}
