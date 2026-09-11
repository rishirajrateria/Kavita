/**
 * Turns one validated tracker batch into session / pageview / event rows. Pure with respect
 * to the request: the route resolves IP, user agent, geo and the visitor hash; this module
 * only writes. Every statement is idempotent on the tracker's keys, so a beacon retried by
 * the browser cannot double count.
 */
import { and, eq, sql } from "drizzle-orm";
import {
  ANALYTICS_EVENT_NAMES,
  analyticsEvents,
  analyticsPageviews,
  analyticsSessions,
  type Channel,
  type DeviceType,
  type TrackedEventName,
} from "@/db/schema/analytics";
import type { AnalyticsDb } from "./db";
import { normalisePath } from "./paths";
import { classifyChannel, referrerHost } from "./referrer";
import type { TrackerBatch } from "./schema";

export interface IngestContext {
  visitorHash: string;
  country: string | null;
  region: string | null;
  city: string | null;
  deviceType: DeviceType;
  os: string;
  browser: string;
  isBot: boolean;
  /** Host of this site, so self-referrals count as direct. */
  siteHost: string | null;
  now: Date;
}

export interface IngestResult {
  sessionId: string;
  pageviews: number;
  events: number;
}

const CONVERSIONS = new Set<string>(ANALYTICS_EVENT_NAMES);

/** Client timestamps are trusted only within the last minute, for ordering inside a batch. */
function occurredAt(ts: number, now: Date): Date {
  const floor = now.getTime() - 60_000;
  return new Date(Math.min(now.getTime(), Math.max(floor, ts)));
}

function clean(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}

export async function ingestBatch(
  db: AnalyticsDb,
  batch: TrackerBatch,
  ctx: IngestContext,
): Promise<IngestResult> {
  const firstPageview = batch.ev.find((e) => e.t === "pv");
  const entryPath = normalisePath(firstPageview?.p ?? batch.ev[0]?.p ?? "/");
  const referrer = clean(batch.ref ?? firstPageview?.r, 1024);
  const host = referrerHost(referrer);
  const utm = firstPageview?.u;
  const channel: Channel = classifyChannel({
    referrerHost: host,
    siteHost: ctx.siteHost,
    utmSource: utm?.s,
    utmMedium: utm?.m,
    utmCampaign: utm?.c,
  });

  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(analyticsSessions)
      .values({
        visitorHash: ctx.visitorHash,
        clientSid: batch.sid,
        entryPath,
        exitPath: entryPath,
        referrer,
        referrerHost: host,
        channel,
        utmSource: clean(utm?.s, 120),
        utmMedium: clean(utm?.m, 120),
        utmCampaign: clean(utm?.c, 120),
        utmContent: clean(utm?.n, 120),
        utmTerm: clean(utm?.t, 120),
        country: ctx.country,
        region: ctx.region,
        city: ctx.city,
        deviceType: ctx.deviceType,
        os: ctx.os,
        browser: ctx.browser,
        screenW: batch.sw ?? null,
        screenH: batch.sh ?? null,
        connection: clean(batch.conn, 16),
        isBot: ctx.isBot,
        startedAt: ctx.now,
        lastSeenAt: ctx.now,
      })
      .onConflictDoUpdate({
        target: [analyticsSessions.visitorHash, analyticsSessions.clientSid],
        set: {
          lastSeenAt: ctx.now,
          durationMs: sql`greatest(0, (extract(epoch from (${ctx.now.toISOString()}::timestamptz - ${analyticsSessions.startedAt})) * 1000)::int)`,
          screenW: sql`coalesce(${analyticsSessions.screenW}, excluded.screen_w)`,
          screenH: sql`coalesce(${analyticsSessions.screenH}, excluded.screen_h)`,
          connection: sql`coalesce(${analyticsSessions.connection}, excluded.connection)`,
        },
      })
      .returning({ id: analyticsSessions.id, pageviewCount: analyticsSessions.pageviewCount });
    if (!session) throw new Error("session upsert returned no row");

    let pageviews = 0;
    let events = 0;
    for (const ev of batch.ev) {
      const path = normalisePath(ev.p);
      const at = occurredAt(ev.ts, ctx.now);
      if (ev.t === "pv") {
        const inserted = await tx
          .insert(analyticsPageviews)
          .values({
            sessionId: session.id,
            clientKey: ev.k,
            path,
            title: clean(ev.ti, 200),
            referrer: clean(ev.r, 1024),
            occurredAt: at,
            isEntry: session.pageviewCount + pageviews === 0,
            isExit: true,
          })
          .onConflictDoNothing({
            target: [analyticsPageviews.sessionId, analyticsPageviews.clientKey],
          })
          .returning({ id: analyticsPageviews.id });
        if (inserted.length === 0) continue;
        pageviews += 1;
        await tx
          .update(analyticsPageviews)
          .set({ isExit: false })
          .where(
            and(
              eq(analyticsPageviews.sessionId, session.id),
              eq(analyticsPageviews.isExit, true),
              sql`${analyticsPageviews.clientKey} <> ${ev.k}`,
            ),
          );
        await tx
          .update(analyticsSessions)
          .set({
            pageviewCount: sql`${analyticsSessions.pageviewCount} + 1`,
            exitPath: path,
            lastSeenAt: at,
          })
          .where(eq(analyticsSessions.id, session.id));
      } else if (ev.t === "pe") {
        await tx
          .update(analyticsPageviews)
          .set({
            timeOnPageMs: sql`greatest(coalesce(${analyticsPageviews.timeOnPageMs}, 0), ${ev.tp})`,
            durationMs: sql`greatest(coalesce(${analyticsPageviews.durationMs}, 0), ${ev.tp})`,
            scrollDepthMax: sql`greatest(${analyticsPageviews.scrollDepthMax}, ${ev.sd})`,
            title: sql`coalesce(${analyticsPageviews.title}, ${clean(ev.ti, 200)})`,
          })
          .where(
            and(
              eq(analyticsPageviews.sessionId, session.id),
              eq(analyticsPageviews.clientKey, ev.k),
            ),
          );
      } else if (ev.t === "sd") {
        await tx
          .update(analyticsPageviews)
          .set({ scrollDepthMax: sql`greatest(${analyticsPageviews.scrollDepthMax}, ${ev.d})` })
          .where(
            and(
              eq(analyticsPageviews.sessionId, session.id),
              eq(analyticsPageviews.clientKey, ev.k),
            ),
          );
      } else {
        const name: TrackedEventName = ev.n;
        const inserted = await tx
          .insert(analyticsEvents)
          .values({
            sessionId: session.id,
            name,
            path,
            props: ev.pr,
            eventId: ev.id ?? (CONVERSIONS.has(name) ? `${session.id}:${name}:${ev.ts}` : null),
            occurredAt: at,
          })
          .onConflictDoNothing({ target: [analyticsEvents.eventId] })
          .returning({ id: analyticsEvents.id });
        events += inserted.length;
      }
    }
    return { sessionId: session.id, pageviews, events };
  });
}
