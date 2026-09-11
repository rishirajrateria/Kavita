"use client";

/**
 * Realtime feed (the one live island). With `NEXT_PUBLIC_SUPABASE_*` present it subscribes to
 * Supabase Realtime `analytics_pageviews` INSERTs and refetches the snapshot on each one
 * (the derived numbers stay server-side); otherwise it polls `/api/admin/realtime` every 10 s.
 * The previous render is held at reduced opacity while a refresh is in flight — no skeleton flash.
 */
import { createBrowserClient } from "@supabase/ssr";
import * as React from "react";
import type { RealtimeSnapshot } from "@/lib/analytics/queries";

export type RealtimeFeedSnapshot = RealtimeSnapshot & { connected: boolean };

const POLL_MS = 10_000;

export function RealtimeFeed({
  initial,
  supabase,
}: {
  initial: RealtimeFeedSnapshot;
  supabase: { url: string; anonKey: string } | null;
}) {
  const [snapshot, setSnapshot] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [mode, setMode] = React.useState<"polling" | "live">("polling");

  const refresh = React.useCallback(async () => {
    setPending(true);
    try {
      const res = await fetch("/api/admin/realtime", { cache: "no-store" });
      if (res.ok) setSnapshot((await res.json()) as RealtimeFeedSnapshot);
    } catch {
      /* keep the last snapshot */
    } finally {
      setPending(false);
    }
  }, []);

  React.useEffect(() => {
    if (!initial.connected) return;
    if (supabase) {
      const client = createBrowserClient(supabase.url, supabase.anonKey);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const channel = client
        .channel("admin-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "analytics_pageviews" },
          () => {
            clearTimeout(timer);
            timer = setTimeout(refresh, 400);
          },
        )
        .subscribe((status) => setMode(status === "SUBSCRIBED" ? "live" : "polling"));
      const fallback = setInterval(refresh, POLL_MS * 3);
      return () => {
        clearTimeout(timer);
        clearInterval(fallback);
        void client.removeChannel(channel);
      };
    }
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [initial.connected, refresh, supabase]);

  if (!initial.connected) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Connect Supabase to see live visitors. Realtime reads the last five minutes of raw pageviews
        and events.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 transition-opacity" style={{ opacity: pending ? 0.6 : 1 }}>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={
              mode === "live" ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"
            }
          />
          {mode === "live" ? "Live via Supabase Realtime" : "Polling every 10 seconds"}
        </span>
        <span>Updated {new Date(snapshot.generatedAt).toLocaleTimeString("en-GB")}</span>
        <span
          className="ml-auto font-sans text-2xl font-semibold text-foreground"
          aria-live="polite"
        >
          {snapshot.activeSessions.length}{" "}
          <span className="text-sm font-normal text-muted-foreground">active now</span>
        </span>
      </div>

      <section
        aria-labelledby="rt-sessions"
        className="overflow-hidden rounded-xl border border-accent-border/40 bg-card shadow-xs"
      >
        <h2 id="rt-sessions" className="border-b border-border px-4 py-3 font-serif text-lg">
          Active sessions (last {Math.round(snapshot.windowSeconds / 60)} minutes)
        </h2>
        {snapshot.activeSessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nobody on the site right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Page</th>
                  <th className="px-4 py-2 text-left font-medium">Location</th>
                  <th className="px-4 py-2 text-left font-medium">Device</th>
                  <th className="px-4 py-2 text-left font-medium">Referrer</th>
                  <th className="px-4 py-2 text-right font-medium">Views</th>
                  <th className="px-4 py-2 text-right font-medium">On site</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.activeSessions.map((s, i) => (
                  <tr
                    key={`${s.startedAt}-${i}`}
                    className={i % 2 === 1 ? "bg-surface-muted/40" : undefined}
                  >
                    <td className="max-w-64 truncate px-4 py-2 font-mono text-xs">{s.path}</td>
                    <td className="px-4 py-2">
                      {[s.city, s.country].filter(Boolean).join(", ") || "Unknown"}
                    </td>
                    <td className="px-4 py-2">{s.device ?? "–"}</td>
                    <td className="max-w-48 truncate px-4 py-2 text-muted-foreground">
                      {s.referrerHost ?? "Direct"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{s.pageviews}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatSeconds(s.secondsOnSite)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-labelledby="rt-events"
        className="overflow-hidden rounded-xl border border-accent-border/40 bg-card shadow-xs"
      >
        <h2 id="rt-events" className="border-b border-border px-4 py-3 font-serif text-lg">
          Latest events
        </h2>
        {snapshot.events.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {snapshot.events.map((e, i) => (
              <li
                key={`${e.occurredAt}-${i}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm"
              >
                <time dateTime={e.occurredAt} className="w-20 text-muted-foreground tabular-nums">
                  {new Date(e.occurredAt).toLocaleTimeString("en-GB")}
                </time>
                <span className="rounded-full border border-accent-border/60 bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {e.name}
                </span>
                <span className="truncate font-mono text-xs">{e.path}</span>
                {e.country ? (
                  <span className="ml-auto text-xs text-muted-foreground">{e.country}</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.max(0, Math.round(s))}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
