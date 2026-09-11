/**
 * Deterministic synthetic analytics for the dashboard: 12 months of rollups (seasonality, weekly
 * rhythm, growth, the seven markets, AI referrals, the booking funnel) plus a few days of raw
 * sessions, pageviews and events so realtime and behaviour panels have something to show.
 * Everything is generated — no real visitor is represented — and the same seed always yields
 * the same dataset. Rollups come from `aggregateDay`, the cron's own aggregation.
 */
import { sql } from "drizzle-orm";
import {
  analyticsDailyRollup,
  analyticsEvents,
  analyticsPageviews,
  analyticsSessions,
  type NewAnalyticsDailyRollup,
  type TrackedEventName,
} from "@/db/schema";
import type { AnalyticsDb } from "./db";
import {
  AI,
  BROWSER_BY_OS,
  CAMPAIGNS,
  CITIES,
  CONNECTIONS,
  CORE_PATHS,
  COUNTRIES,
  DEVICES,
  OS_BY_DEVICE,
  REFERRAL,
  SCREENS_BY_DEVICE,
  SEARCH,
  SOCIAL,
  TITLES,
} from "./seed-tables";
import { addDays, toDay } from "./ranges";
import {
  aggregateDay,
  rollupDay,
  type RawEvent,
  type RawPageview,
  type RawSession,
} from "./rollup";

export interface SeedOptions {
  /** Last day of the rollup history (defaults to today, UTC). */
  now?: Date;
  /** Days of rollup history to generate. */
  days?: number;
  /** Days (ending today) that also get raw rows. */
  rawDays?: number;
  /** Multiplies daily session volume (1 ≈ 60–140 sessions a day). */
  scale?: number;
  /** Geo-page hrefs to spread traffic over; about a third are left with zero traffic. */
  geoPageHrefs?: string[];
  seed?: number;
}

export interface SeedResult {
  days: number;
  rollupRows: number;
  rawSessions: number;
  rawPageviews: number;
  rawEvents: number;
}

/* ---- deterministic randomness ------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, table: readonly (readonly [T, number])[]): T {
  const total = table.reduce((n, [, w]) => n + w, 0);
  let x = rng() * total;
  for (const [value, weight] of table) {
    x -= weight;
    if (x <= 0) return value;
  }
  return table[table.length - 1]![0];
}

function hex(rng: Rng, length: number): string {
  let s = "";
  while (s.length < length) s += Math.floor(rng() * 16).toString(16);
  return s;
}

function uuid(rng: Rng): string {
  const h = hex(rng, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/* ---- generation --------------------------------------------------------------------------- */

interface DayRaw {
  sessions: RawSession[];
  pageviews: RawPageview[];
  events: RawEvent[];
}

function dailyVolume(
  dayIndex: number,
  totalDays: number,
  date: Date,
  scale: number,
  rng: Rng,
): number {
  const progress = dayIndex / Math.max(1, totalDays - 1);
  const growth = 1 + 0.6 * progress;
  const month = date.getUTCMonth();
  const seasonal = 1 + 0.35 * Math.cos(((month - 9.5) / 12) * 2 * Math.PI); // peak Oct/Nov
  const weekday = date.getUTCDay();
  const weekly = weekday === 0 || weekday === 6 ? 0.82 : weekday === 1 ? 1.08 : 1;
  const noise = 0.8 + rng() * 0.4;
  return Math.max(5, Math.round(85 * scale * growth * seasonal * weekly * noise));
}

function generateDay(
  day: string,
  dayIndex: number,
  totalDays: number,
  opts: Required<Pick<SeedOptions, "scale">> & {
    geoPages: string[];
    geoWeights: number[];
    rng: Rng;
    /** Last day only: no session starts after this instant (today is partial). */
    cutoff?: Date;
  },
): DayRaw {
  const { rng } = opts;
  const date = new Date(`${day}T00:00:00Z`);
  const volume = dailyVolume(dayIndex, totalDays, date, opts.scale, rng);
  const progress = dayIndex / Math.max(1, totalDays - 1);
  const aiShare = 3 + 6 * progress; // AI referrals grow across the year
  const channelTable = [
    ["search", 47],
    ["direct", 21],
    ["social", 12],
    ["ai", aiShare],
    ["referral", 7],
    ["campaign", 5],
  ] as const;
  const geoTable: (readonly [string, number])[] = opts.geoPages.map((href, i) => [
    href,
    opts.geoWeights[i] ?? 0,
  ]);

  const out: DayRaw = { sessions: [], pageviews: [], events: [] };
  for (let i = 0; i < volume; i++) {
    const country = pick(rng, COUNTRIES);
    const [region, city] = pick(rng, CITIES[country] ?? CITIES.SG!);
    const device = pick(rng, DEVICES);
    const os = pick(rng, OS_BY_DEVICE[device]!);
    const browser = pick(rng, BROWSER_BY_OS[os] ?? BROWSER_BY_OS.Windows!);
    const [sw, sh] = pick(rng, SCREENS_BY_DEVICE[device]!).split("x").map(Number) as [
      number,
      number,
    ];
    const channel = pick(rng, channelTable);
    let referrerHost: string | null = null;
    let utmCampaign: string | null = null;
    if (channel === "search") referrerHost = pick(rng, SEARCH);
    else if (channel === "social") referrerHost = pick(rng, SOCIAL);
    else if (channel === "ai") referrerHost = pick(rng, AI);
    else if (channel === "referral") referrerHost = pick(rng, REFERRAL);
    else if (channel === "campaign") {
      utmCampaign = pick(rng, CAMPAIGNS);
      referrerHost = rng() < 0.6 ? "google.com" : "instagram.com";
    }

    const span = opts.cutoff
      ? Math.max(60_000, opts.cutoff.getTime() - date.getTime())
      : 86_400_000;
    const startedAt = new Date(date.getTime() + Math.floor(rng() * span));
    const id = uuid(rng);
    const visitorHash =
      rng() < 0.18 && out.sessions.length > 0
        ? out.sessions[Math.floor(rng() * out.sessions.length)]!.visitorHash
        : hex(rng, 32);
    const pvCount = rng() < 0.42 ? 1 : 2 + Math.floor(rng() * rng() * 6);

    // Entry page: search and AI land on geo/learn pages far more than direct traffic does.
    const geoFirst =
      channel === "search" || channel === "ai" ? 0.5 : channel === "campaign" ? 0.35 : 0.15;
    const paths: string[] = [];
    for (let p = 0; p < pvCount; p++) {
      const useGeo = geoTable.length > 0 && rng() < (p === 0 ? geoFirst : 0.2);
      let path = useGeo ? pick(rng, geoTable) : pick(rng, CORE_PATHS);
      if (p > 0 && paths[p - 1] === path) path = pick(rng, CORE_PATHS);
      paths.push(path);
    }
    const booking = pvCount >= 2 && rng() < 0.07;
    if (booking && !paths.includes("/book")) paths[paths.length - 1] = "/book";

    let t = startedAt.getTime();
    const pvs: RawPageview[] = paths.map((path, index) => {
      const timeOnPage = Math.round(8_000 + rng() * rng() * 150_000);
      const occurredAt = new Date(t);
      t += timeOnPage + 500;
      const depth = pick(rng, [
        [0, 18],
        [25, 22],
        [50, 22],
        [75, 16],
        [90, 10],
        [100, 12],
      ] as const);
      return {
        id: uuid(rng),
        sessionId: id,
        clientKey: hex(rng, 16),
        path,
        title: TITLES[path] ?? null,
        referrer: index === 0 && referrerHost ? `https://${referrerHost}/` : null,
        occurredAt,
        durationMs: timeOnPage,
        timeOnPageMs: timeOnPage,
        scrollDepthMax: depth,
        isEntry: index === 0,
        isExit: index === paths.length - 1,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      };
    });
    const lastSeenAt = new Date(t);
    const durationMs = lastSeenAt.getTime() - startedAt.getTime();

    out.sessions.push({
      id,
      visitorHash,
      clientSid: hex(rng, 16),
      entryPath: paths[0]!,
      exitPath: paths[paths.length - 1]!,
      referrer: referrerHost ? `https://${referrerHost}/` : null,
      referrerHost,
      channel,
      utmSource: utmCampaign ? (referrerHost === "google.com" ? "google" : "instagram") : null,
      utmMedium: utmCampaign ? "cpc" : null,
      utmCampaign,
      utmContent: null,
      utmTerm: null,
      country,
      region,
      city,
      deviceType: device,
      os,
      browser,
      screenW: sw,
      screenH: sh,
      connection: device === "desktop" ? null : pick(rng, CONNECTIONS),
      isBot: false,
      pageviewCount: pvCount,
      durationMs,
      startedAt,
      lastSeenAt,
      createdAt: startedAt,
      updatedAt: lastSeenAt,
    });
    out.pageviews.push(...pvs);

    const event = (
      name: TrackedEventName,
      path: string,
      props: RawEvent["props"],
      at: Date,
      eventId: string | null = null,
    ): RawEvent => ({
      id: uuid(rng),
      sessionId: id,
      name,
      path,
      props,
      eventId,
      occurredAt: at,
      createdAt: at,
      updatedAt: at,
    });

    for (const pv of pvs) {
      const clicks = Math.floor(rng() * rng() * 5);
      for (let c = 0; c < clicks; c++) {
        const x = Math.round((10 + rng() * 80) * 10) / 10;
        const y = Math.round((5 + rng() * rng() * 90) * 10) / 10;
        const interactive = rng() < 0.7;
        out.events.push(
          event(
            "click",
            pv.path,
            {
              sel: interactive ? "main>a.btn" : "main>p",
              txt: interactive ? "Book a consultation" : "",
              x,
              y,
              i: interactive ? 1 : 0,
            },
            new Date(pv.occurredAt.getTime() + rng() * 5_000),
          ),
        );
        if (!interactive && rng() < 0.25)
          out.events.push(
            event(
              "dead_click",
              pv.path,
              { sel: "main>p", txt: "", x, y },
              new Date(pv.occurredAt.getTime() + 5_500),
            ),
          );
        if (rng() < 0.02)
          out.events.push(
            event(
              "rage_click",
              pv.path,
              { sel: "header>button.menu", txt: "Menu", x, y },
              new Date(pv.occurredAt.getTime() + 6_000),
            ),
          );
      }
      if (pv.path === "/contact" && rng() < 0.5) {
        out.events.push(
          event("form_focus", pv.path, { field: "message", form: "contact-form" }, pv.occurredAt),
        );
        if (rng() < 0.55)
          out.events.push(
            event(
              "form_abandon",
              pv.path,
              { form: "contact-form", last: "message" },
              new Date(pv.occurredAt.getTime() + 20_000),
            ),
          );
        else
          out.events.push(
            event(
              "contact_submitted",
              pv.path,
              { source: "web_form", hasPhone: rng() < 0.6 },
              new Date(pv.occurredAt.getTime() + 40_000),
              hex(rng, 24),
            ),
          );
      }
      if (rng() < 0.012)
        out.events.push(
          event(
            "whatsapp_clicked",
            pv.path,
            { placement: "mobile-cta-bar" },
            pv.occurredAt,
            hex(rng, 24),
          ),
        );
      if (rng() < 0.005)
        out.events.push(
          event("call_clicked", pv.path, { placement: "footer" }, pv.occurredAt, hex(rng, 24)),
        );
    }

    if (booking) {
      const at = pvs[pvs.length - 1]!.occurredAt;
      out.events.push(
        event(
          "booking_started",
          "/book",
          { serviceSlug: "integrated-life-reading" },
          at,
          hex(rng, 24),
        ),
      );
      const steps = 2 + Math.floor(rng() * 6); // reaches step 2..7
      for (let step = 2; step <= steps; step++) {
        out.events.push(
          event(
            "booking_step",
            "/book",
            { step, serviceSlug: "integrated-life-reading" },
            new Date(at.getTime() + step * 15_000),
            hex(rng, 24),
          ),
        );
      }
      if (steps >= 7 && rng() < 0.75) {
        out.events.push(
          event(
            "booking_completed",
            "/book",
            { serviceSlug: "integrated-life-reading" },
            new Date(at.getTime() + 120_000),
            hex(rng, 24),
          ),
        );
      }
    }
  }
  return out;
}

/* ---- writing ------------------------------------------------------------------------------ */

async function insertChunked<T>(rows: T[], size: number, write: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await write(rows.slice(i, i + size));
}

/** Generate and write the dataset. Existing analytics rows are removed first (idempotent). */
export async function seedAnalytics(
  db: AnalyticsDb,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const now = options.now ?? new Date();
  const days = options.days ?? 365;
  const rawDays = Math.min(options.rawDays ?? 7, days);
  const scale = options.scale ?? 1;
  const rng = mulberry32(options.seed ?? 20260911);
  const geoPages = [...(options.geoPageHrefs ?? [])].sort();
  // A third of geo pages get no traffic at all — the dashboard must surface them.
  const geoWeights = geoPages.map((_, i) => (i % 3 === 2 ? 0 : 1 + rng() * 6));

  await db.delete(analyticsDailyRollup);
  await db.delete(analyticsSessions);
  await db.delete(analyticsEvents);

  const today = toDay(now);
  const firstDay = addDays(today, -(days - 1));
  const rollupRows: NewAnalyticsDailyRollup[] = [];
  const raw: DayRaw = { sessions: [], pageviews: [], events: [] };
  const rawDayList: string[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(firstDay, i);
    const generated = generateDay(day, i, days, {
      scale,
      geoPages,
      geoWeights,
      rng,
      cutoff: i === days - 1 ? now : undefined,
    });
    if (i >= days - rawDays) {
      raw.sessions.push(...generated.sessions);
      raw.pageviews.push(...generated.pageviews);
      raw.events.push(...generated.events);
      rawDayList.push(day);
    } else {
      rollupRows.push(
        ...aggregateDay(day, generated.sessions, generated.pageviews, generated.events),
      );
    }
  }

  await insertChunked(rollupRows, 400, (chunk) => db.insert(analyticsDailyRollup).values(chunk));
  await insertChunked(raw.sessions, 300, (chunk) => db.insert(analyticsSessions).values(chunk));
  await insertChunked(raw.pageviews, 300, (chunk) => db.insert(analyticsPageviews).values(chunk));
  await insertChunked(raw.events, 300, (chunk) => db.insert(analyticsEvents).values(chunk));
  let rolled = 0;
  for (const day of rawDayList) rolled += await rollupDay(db, day);
  await db.execute(sql`analyze analytics_daily_rollup`);

  return {
    days,
    rollupRows: rollupRows.length + rolled,
    rawSessions: raw.sessions.length,
    rawPageviews: raw.pageviews.length,
    rawEvents: raw.events.length,
  };
}
