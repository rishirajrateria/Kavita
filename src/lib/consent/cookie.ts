/**
 * The `ak_consent` cookie (CLAUDE.md §13E). Set only after the visitor makes a choice; readable
 * by the client island (not HttpOnly) so a stored choice applies without a round trip. Carries
 * no identity: the visitor id is the anonymous consent-log id, the region is what the edge
 * reported at decision time. Isomorphic: no Node or DOM APIs.
 */

export const CONSENT_COOKIE = "ak_consent";
/** Six months — re-asked after that, or sooner when the policy version changes. */
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export type ConsentState = "granted" | "denied";

export interface ConsentCookie {
  /** Policy version the choice was made under; a newer policy re-asks. */
  v: string;
  /** Marketing (third-party pixels). */
  m: ConsentState;
  /** Anonymous visitor id, matches `consent_log.visitor_id`. */
  id: string;
  /** Region at decision time (ISO 3166-1 alpha-2) or null. */
  r: string | null;
  /** Unix seconds. */
  t: number;
}

export function serializeConsentCookie(value: ConsentCookie): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function parseConsentCookie(raw: string | null | undefined): ConsentCookie | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (typeof p.v !== "string" || typeof p.id !== "string" || typeof p.t !== "number") return null;
    if (p.m !== "granted" && p.m !== "denied") return null;
    return {
      v: p.v,
      m: p.m,
      id: p.id.slice(0, 64),
      r: typeof p.r === "string" ? p.r.slice(0, 2).toUpperCase() : null,
      t: p.t,
    };
  } catch {
    return null;
  }
}

/** Read the consent cookie from a `Cookie` header or `document.cookie` string. */
export function readConsentCookie(cookieHeader: string | null | undefined): ConsentCookie | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === CONSENT_COOKIE) return parseConsentCookie(part.slice(eq + 1));
  }
  return null;
}

/** A stored choice counts only when it was made under the current policy version. */
export function consentStateFor(
  cookie: ConsentCookie | null,
  policyVersion: string,
): ConsentState | "unknown" {
  if (!cookie || cookie.v !== policyVersion) return "unknown";
  return cookie.m;
}
