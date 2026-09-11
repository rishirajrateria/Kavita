import { EventsBridge } from "./events-bridge";

/**
 * First-party analytics tracker (CLAUDE.md §13.E, Phase 5 Part A). Server component: it emits
 * the deferred `<script src="/t.js">` tag and the tiny client bridge for conversion events.
 * Cookieless and disclosed in the privacy policy, so it is never gated behind consent; the
 * script itself honours Do Not Track, Global Privacy Control and `localStorage.ak_optout`.
 * Set `ANALYTICS_DISABLED=true` to leave the tag out entirely (e.g. on preview deployments).
 */
export function Tracker() {
  if (process.env.ANALYTICS_DISABLED === "true") return null;
  return (
    <>
      <script defer src="/t.js" />
      <EventsBridge />
    </>
  );
}
