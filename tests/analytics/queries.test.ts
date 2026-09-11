/**
 * Every query function against the seeded 12-month PGlite dataset, each asserted < 800 ms
 * (contract). Also proves the seed shape the dashboard relies on.
 */
import { performance } from "node:perf_hooks";
import { count } from "drizzle-orm";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { analyticsDailyRollup } from "@/db/schema";
import { ingestBatch } from "@/lib/analytics/ingest";
import {
  getAcquisition,
  getBehaviour,
  getBreakdown,
  getFunnel,
  getGeoDrilldown,
  getGeoPagePerformance,
  getOverview,
  getPages,
  getRealtime,
  getScrollDistribution,
  getTechnology,
  getTimeseries,
} from "@/lib/analytics/queries";
import { resolveRange } from "@/lib/analytics/ranges";
import { parseBatch } from "@/lib/analytics/schema";
import { seedAnalytics } from "@/lib/analytics/seed-data";
import { listGeoPages } from "@/lib/geo/pages";
import { context, sampleBatch } from "./ingest.test";

const BUDGET_MS = 800;

export async function run() {
  const { db, close } = await createTestDb();
  try {
    const now = new Date("2026-09-11T12:00:00Z");
    const geoPageHrefs = (await listGeoPages()).map((p) => p.href);
    const t0 = performance.now();
    const seed = await seedAnalytics(db, { now, geoPageHrefs });
    const seedMs = Math.round(performance.now() - t0);
    const [rollupCount] = await db.select({ n: count() }).from(analyticsDailyRollup);
    const n = rollupCount?.n ?? 0;
    console.log(
      `  seed: ${seed.days} days, ${n} rollup rows, ${seed.rawSessions} sessions / ${seed.rawPageviews} pageviews / ${seed.rawEvents} events (${seedMs} ms)`,
    );
    check(seed.days === 365, "seed covers 12 months");
    check(seed.rawSessions > 300, "seed has raw sessions for the last 7 days");

    const timings: string[] = [];
    async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      const value = await fn();
      const ms = Math.round(performance.now() - start);
      timings.push(`${name} ${ms}ms`);
      check(ms < BUDGET_MS, `${name} took ${ms} ms (budget ${BUDGET_MS})`);
      return value;
    }
    const opts = { db };
    const r30 = resolveRange({ preset: "30d" }, now);
    const r90 = resolveRange({ preset: "90d" }, now);
    const year = { from: "2025-09-12", to: "2026-09-11" };

    const overview = await timed("getOverview(30d, compare)", () =>
      getOverview({ ...r30, compare: true }, opts),
    );
    check(overview.current.sessions > 500, `overview sessions ${overview.current.sessions}`);
    check(overview.current.pageviews > overview.current.sessions, "pageviews exceed sessions");
    check(
      overview.current.bounceRate > 10 && overview.current.bounceRate < 80,
      `bounce rate ${overview.current.bounceRate}`,
    );
    check(overview.previous !== null && overview.deltas !== null, "comparison present");
    check(overview.deltas?.sessions !== null, "session delta computed");
    const geoOverview = await timed("getOverview(geo IN)", () =>
      getOverview({ ...r30, compare: false, geo: { country: "IN" } }, opts),
    );
    check(
      geoOverview.geoFilterApplied &&
        geoOverview.current.sessions > 0 &&
        geoOverview.current.sessions < overview.current.sessions,
      "geo-filtered overview",
    );
    const yearOverview = await timed("getOverview(12 months)", () =>
      getOverview({ ...year, compare: true }, opts),
    );
    check(
      yearOverview.current.sessions > 20000,
      `12-month sessions ${yearOverview.current.sessions}`,
    );

    const daily = await timed("getTimeseries(day, 90d)", () =>
      getTimeseries({ ...r90, granularity: "day", metric: "sessions" }, opts),
    );
    equal(daily.length, 90, "one point per day, zero-filled");
    check(
      daily.every((p) => p.value > 0),
      "every day has sessions",
    );
    const weekly = await timed("getTimeseries(week, year)", () =>
      getTimeseries({ ...year, granularity: "week", metric: "visitors" }, opts),
    );
    check(weekly.length >= 52 && weekly.length <= 54, `weekly points ${weekly.length}`);
    const monthly = await timed("getTimeseries(month, year, bounceRate)", () =>
      getTimeseries({ ...year, granularity: "month", metric: "bounceRate" }, opts),
    );
    equal(monthly.length, 13, "13 month buckets across a year window");
    check(
      monthly.every((p) => p.value >= 0 && p.value <= 100),
      "bounce rate is a percentage",
    );

    const countries = await timed("getBreakdown(country)", () =>
      getBreakdown({ ...r30, dim: "country", limit: 5, offset: 0 }, opts),
    );
    equal(countries.rows[0]?.key, "IN", "India leads");
    check(countries.total >= 7, "seven markets and more");
    check(countries.rows.length === 5 && countries.rows[0]!.share > 30, "pagination and share");
    const page2 = await timed("getBreakdown(country, offset)", () =>
      getBreakdown({ ...r30, dim: "country", limit: 5, offset: 5 }, opts),
    );
    check(
      page2.rows.length > 0 && page2.rows[0]?.key !== countries.rows[0]?.key,
      "second page differs",
    );
    const sorted = await timed("getBreakdown(path, sort bounceRate asc)", () =>
      getBreakdown(
        { ...r90, dim: "path", limit: 10, sort: { by: "bounceRate", dir: "asc" } },
        opts,
      ),
    );
    check(sorted.rows.length === 10, "sorted breakdown");

    const drill = await timed("getGeoDrilldown(countries)", () => getGeoDrilldown(r30, opts));
    equal(drill.level, "country", "top level");
    const regions = await timed("getGeoDrilldown(IN)", () =>
      getGeoDrilldown({ ...r30, country: "IN" }, opts),
    );
    check(
      regions.level === "region" && regions.rows.every((r) => r.country === "IN"),
      "regions of India",
    );
    const cities = await timed("getGeoDrilldown(IN/Maharashtra)", () =>
      getGeoDrilldown({ ...r30, country: "IN", region: "Maharashtra" }, opts),
    );
    check(cities.rows.map((r) => r.city).includes("Mumbai"), "cities of Maharashtra");
    check(
      cities.rows.every((r) => r.region === "Maharashtra"),
      "no other regions leak in",
    );

    const top = await timed("getPages(top)", () => getPages({ ...r30, kind: "top" }, opts));
    equal(top.rows[0]?.path, "/", "home is the top page");
    check(
      top.rows[0]!.scroll.length === 5 &&
        top.rows[0]!.scroll[0]!.pct >= top.rows[0]!.scroll[4]!.pct,
      "scroll buckets descend",
    );
    const entry = await timed("getPages(entry)", () =>
      getPages({ ...r30, kind: "entry", limit: 5 }, opts),
    );
    check(
      entry.rows.every((r, i, a) => i === 0 || a[i - 1]!.entries >= r.entries),
      "entry pages sorted by entries",
    );
    const exit = await timed("getPages(exit)", () =>
      getPages({ ...r30, kind: "exit", limit: 5 }, opts),
    );
    check(exit.rows[0]!.exitRate > 0, "exit rate");

    const scroll = await timed("getScrollDistribution(/)", () =>
      getScrollDistribution({ ...r90, path: "/" }, opts),
    );
    check(scroll.pageviews > 0 && scroll.buckets.length === 5, "scroll distribution");

    const perf = await timed("getGeoPagePerformance", () => getGeoPagePerformance(r90, opts));
    equal(perf.totalPages, geoPageHrefs.length, "every geo page listed");
    check(
      perf.zeroTrafficPages > 0 && perf.zeroTrafficPages < perf.totalPages,
      `zero-traffic pages ${perf.zeroTrafficPages}/${perf.totalPages}`,
    );
    check(perf.rows[0]!.pageviews >= perf.rows[1]!.pageviews, "sorted by pageviews");

    const behaviour = await timed("getBehaviour(site, 7d)", () =>
      getBehaviour(resolveRange({ preset: "7d" }, now), opts),
    );
    check(
      behaviour.clicks > 0 && behaviour.heat.total === behaviour.clicks,
      "heat grid totals match clicks",
    );
    equal(behaviour.heat.cells.length, 24 * 40, "24×40 grid");
    check(behaviour.rageClicks > 0 && behaviour.deadClicks > 0, "rage and dead clicks present");
    check(behaviour.topDead.length > 0, "dead click targets");
    const behaviourPage = await timed("getBehaviour(/contact)", () =>
      getBehaviour({ ...resolveRange({ preset: "7d" }, now), path: "/contact" }, opts),
    );
    check(behaviourPage.formAbandons > 0, "form abandons on /contact");

    const acquisition = await timed("getAcquisition", () => getAcquisition(r30, opts));
    check(
      acquisition.channels.some((c) => c.key === "search"),
      "channels",
    );
    check(
      acquisition.ai.length >= 6 &&
        acquisition.ai.some((r) => r.key === "chatgpt.com" && r.sessions > 0),
      "AI referrals",
    );
    check(acquisition.searchEngines[0]?.key === "google.com", "search engines");
    check(
      acquisition.social.length > 0 &&
        acquisition.campaigns.length > 0 &&
        acquisition.direct.sessions > 0,
      "social, campaigns, direct",
    );

    const tech = await timed("getTechnology", () => getTechnology(r30, opts));
    check(
      tech.devices[0]?.key === "mobile" &&
        tech.browsers.length > 0 &&
        tech.screens.length > 0 &&
        tech.connections.length > 0,
      "technology",
    );

    const funnel = await timed("getFunnel", () => getFunnel(r90, opts));
    equal(funnel.steps[0]?.key, "started", "funnel starts with booking_started");
    equal(funnel.steps[funnel.steps.length - 1]?.key, "completed", "…and ends with completed");
    check(
      funnel.steps.every((s, i, a) => i === 0 || a[i - 1]!.sessions >= s.sessions),
      "monotonic drop-off",
    );
    check(
      funnel.conversionRate > 0 && funnel.conversionRate < 100,
      `funnel conversion ${funnel.conversionRate}%`,
    );
    check(
      funnel.byPage.length > 0 &&
        funnel.byCountry.length > 0 &&
        funnel.byDevice.length > 0 &&
        funnel.bySource.length > 0,
      "conversion tables",
    );
    check(
      funnel.contactSubmitted > 0 && funnel.whatsappClicked > 0,
      "contact and WhatsApp conversions",
    );

    // Realtime: ingest a live batch and see it within the 5-minute window.
    const live = parseBatch(JSON.stringify(sampleBatch("00000000000000ee", "00000000000000ef")));
    if (!live) throw new Error("live batch did not parse");
    await ingestBatch(
      db,
      live,
      context({ visitorHash: "e".repeat(32), now: new Date(now.getTime() - 30_000) }),
    );
    const realtime = await timed("getRealtime", () => getRealtime({ db, now }));
    check(
      realtime.activeSessions.some(
        (s) => s.path === "/astrologer/india/maharashtra/mumbai" && s.country === "IN",
      ),
      "live session visible",
    );
    check(
      realtime.events.some((e) => e.name === "whatsapp_clicked"),
      "live event visible",
    );

    // Without a database every function degrades to an empty result.
    const none = await getOverview({ ...r30, compare: true }, { db: null });
    equal(none.current.sessions, 0, "no database → zeroed overview");
    equal(
      (await getBreakdown({ ...r30, dim: "path" }, { db: null })).rows.length,
      0,
      "no database → empty breakdown",
    );
    equal(
      (await getRealtime({ db: null })).activeSessions.length,
      0,
      "no database → empty realtime",
    );

    console.log(`  timings: ${timings.join(", ")}`);
  } finally {
    await close();
  }
}
