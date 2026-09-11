/**
 * `/admin/realtime` — who is on the site right now. Server-renders the first snapshot; the
 * client island keeps it fresh via Supabase Realtime or 10-second polling.
 */
import type { Metadata } from "next";
import { RealtimeFeed } from "@/components/admin/realtime-feed";
import { PanelHeader } from "@/components/admin/shell/panel-header";
import { getRealtime, isAnalyticsConfigured } from "@/lib/analytics/queries";

export const metadata: Metadata = { title: "Realtime" };
export const dynamic = "force-dynamic";

export default async function RealtimePage() {
  const connected = isAnalyticsConfigured();
  const snapshot = await getRealtime();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Realtime"
        description="Active sessions and the latest events from the last five minutes."
      />
      <RealtimeFeed
        initial={{ ...snapshot, connected }}
        supabase={url && anonKey ? { url, anonKey } : null}
      />
    </div>
  );
}
