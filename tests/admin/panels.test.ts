/**
 * Panel performance: the exact query set each analytics panel issues, run against the seeded
 * 12-month PGlite dataset (P5-A's `seedAnalytics`), every call asserted < 800 ms. Also checks
 * the shapes the panels lean on (deltas present, geo drill-down levels, funnel ordering).
 */
import { performance } from "node:perf_hooks";
import { check, equal } from "../seo-plumbing/_assert";
import { createTestDb } from "../helpers/pglite-db";
import { granularityFor } from "@/components/admin/filters/panel";
import { parsePanelParams } from "@/components/admin/filters/search-params";
import { sortSpecFrom } from "@/components/admin/tables/metric-columns";
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
  getTechnology,
  getTimeseries,
} from "@/lib/analytics/queries";
import { seedAnalytics } from "@/lib/analytics/seed-data";
import { listGeoPages } from "@/lib/geo/pages";

const BUDGET_MS = 800;

export async function run() {
  const { db, close } = await createTestDb();
  try {
    const now = new Date("2026-09-11T12:00:00Z");
    const geoPageHrefs = (await listGeoPages()).map((p) => p.href);
    await seedAnalytics(db, { now, geoPageHrefs });
    const opts = { db };
    const timings: string[] = [];
    async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      const value = await fn();
      const ms = Math.round(performance.now() - start);
      timings.push(`${name} ${ms}ms`);
      check(ms < BUDGET_MS, `panel query ${name} took ${ms} ms (budget ${BUDGET_MS})`);
      return value;
    }

    for (const preset of ["7d", "30d", "90d", "this_month"] as const) {
      const p = parsePanelParams({ range: preset }, now);
      const range = { from: p.range.from, to: p.range.to };
      const granularity = granularityFor(p.range.days);

      // Overview.
      const overview = await timed(`${preset} overview`, () =>
        getOverview({ ...range, compare: true }, opts),
      );
      check(overview.deltas !== null, `${preset}: overview has deltas`);
      const ts = await timed(`${preset} timeseries`, () =>
        getTimeseries({ ...range, granularity, metric: "visitors" }, opts),
      );
      check(
        ts.length > 0 && ts.every((pt) => Number.isFinite(pt.value)),
        `${preset}: timeseries values finite`,
      );
      await timed(`${preset} previous timeseries`, () =>
        getTimeseries({ ...p.range.previous, granularity, metric: "visitors" }, opts),
      );
      await timed(`${preset} countries`, () =>
        getBreakdown({ ...range, dim: "country", limit: 8 }, opts),
      );
      const pages = await timed(`${preset} top pages`, () =>
        getPages({ ...range, kind: "top", limit: 25 }, opts),
      );
      const geoPerf = await timed(`${preset} geo page performance`, () =>
        getGeoPagePerformance(range, opts),
      );
      equal(geoPerf.totalPages, geoPageHrefs.length, `${preset}: every geo page listed`);

      // Traffic: sortable source table.
      const sort = sortSpecFrom("bounceRate", "asc");
      const sources = await timed(`${preset} sources sorted`, () =>
        getBreakdown({ ...range, dim: "source", sort, limit: 25, offset: 0 }, opts),
      );
      check(sources.rows.length > 0, `${preset}: sources present`);

      // Geography drill-down.
      const countries = await timed(`${preset} geo countries`, () =>
        getGeoDrilldown({ ...range, limit: 500 }, opts),
      );
      const top = countries.rows[0];
      check(top !== undefined && top.visitors > 0, `${preset}: a top country`);
      if (top) {
        const regions = await timed(`${preset} geo regions`, () =>
          getGeoDrilldown({ ...range, country: top.country, limit: 500 }, opts),
        );
        equal(regions.level, "region", `${preset}: region level`);
        const region = regions.rows[0]?.region;
        if (region) {
          const cities = await timed(`${preset} geo cities`, () =>
            getGeoDrilldown({ ...range, country: top.country, region, limit: 500 }, opts),
          );
          equal(cities.level, "city", `${preset}: city level`);
        }
        await timed(`${preset} overview filtered`, () =>
          getOverview({ ...range, compare: true, geo: { country: top.country } }, opts),
        );
      }

      // Pages, behaviour, acquisition, technology, conversions.
      await timed(`${preset} entry pages`, () =>
        getPages({ ...range, kind: "entry", limit: 25, offset: 25 }, opts),
      );
      const path = pages.rows[0]?.path ?? "/";
      const behaviour = await timed(`${preset} behaviour`, () =>
        getBehaviour({ ...range, path }, opts),
      );
      check(
        behaviour.heat.cells.length === behaviour.heat.cols * behaviour.heat.rows,
        `${preset}: heat grid sized`,
      );
      await timed(`${preset} behaviour site`, () => getBehaviour({ ...range, path: null }, opts));
      const acq = await timed(`${preset} acquisition`, () => getAcquisition(range, opts));
      check(acq.ai.length > 0, `${preset}: AI referrals seeded`);
      await timed(`${preset} technology`, () => getTechnology(range, opts));
      const funnel = await timed(`${preset} funnel`, () => getFunnel(range, opts));
      check(funnel.steps[0]?.key === "started", `${preset}: funnel starts at "started"`);
      check(funnel.steps.at(-1)?.key === "completed", `${preset}: funnel ends at "completed"`);
    }

    const realtime = await timed("realtime", () => getRealtime({ ...opts, now }));
    check(Array.isArray(realtime.activeSessions), "realtime snapshot shape");

    const worst =
      timings.map((t) => Number(/(\d+)ms$/.exec(t)?.[1] ?? 0)).sort((a, b) => b - a)[0] ?? 0;
    console.log(
      `  panels: ${timings.length} queries timed, slowest ${worst} ms (budget ${BUDGET_MS})`,
    );
  } finally {
    await close();
  }
}
