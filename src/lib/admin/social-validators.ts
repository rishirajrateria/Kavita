/**
 * Per-platform URL validation for `social_links` (CLAUDE.md §13.A). Pure and client-safe: the
 * social-links manager runs the same check in the browser before it posts, and the route handler
 * runs it again server-side. A link is only ever an `https:` URL on the platform's own host(s),
 * normalised (lower-case host, no hash, no trailing slash, tracking parameters stripped) so the
 * `social_links.url` unique index and the `sameAs` array see one canonical spelling.
 */
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/db/schema/site";

export { SOCIAL_PLATFORMS };
export type { SocialPlatform };

export interface PlatformRule {
  label: string;
  /** Hosts accepted, `www.` allowed on each. */
  hosts: readonly string[];
  /** Pathname must match one of these (tested against the pathname only). */
  paths: readonly RegExp[];
  /** Human hint shown under the input. */
  hint: string;
  /** Default `icon` key for `social_links.icon`. */
  icon: string;
  /** Whether the link is an entity profile (a `sameAs` candidate) rather than a contact channel. */
  isProfile: boolean;
}

const HANDLE = "[A-Za-z0-9._-]+";
const ANY = /^\/.+/;

export const PLATFORM_RULES: Record<SocialPlatform, PlatformRule> = {
  instagram: {
    label: "Instagram",
    hosts: ["instagram.com"],
    paths: [new RegExp(`^/${HANDLE}/?$`)],
    hint: "https://instagram.com/yourhandle",
    icon: "instagram",
    isProfile: true,
  },
  youtube: {
    label: "YouTube",
    hosts: ["youtube.com"],
    paths: [new RegExp(`^/@${HANDLE}/?$`), /^\/channel\/[A-Za-z0-9_-]{10,}\/?$/],
    hint: "https://youtube.com/@yourhandle or https://youtube.com/channel/UC…",
    icon: "youtube",
    isProfile: true,
  },
  facebook: {
    label: "Facebook",
    hosts: ["facebook.com", "fb.com"],
    paths: [new RegExp(`^/${HANDLE}/?$`), /^\/profile\.php$/, /^\/pages\/.+/],
    hint: "https://facebook.com/yourpage",
    icon: "facebook",
    isProfile: true,
  },
  linkedin: {
    label: "LinkedIn",
    hosts: ["linkedin.com"],
    paths: [new RegExp(`^/in/${HANDLE}/?$`), new RegExp(`^/company/${HANDLE}/?$`)],
    hint: "https://linkedin.com/in/yourname or https://linkedin.com/company/yourbusiness",
    icon: "linkedin",
    isProfile: true,
  },
  x: {
    label: "X (Twitter)",
    hosts: ["x.com", "twitter.com"],
    paths: [/^\/[A-Za-z0-9_]{1,15}\/?$/],
    hint: "https://x.com/yourhandle",
    icon: "x",
    isProfile: true,
  },
  whatsapp: {
    label: "WhatsApp",
    hosts: ["wa.me", "api.whatsapp.com"],
    paths: [/^\/\d{6,15}\/?$/, /^\/send\/?$/],
    hint: "https://wa.me/919876543210 (country code, digits only)",
    icon: "whatsapp",
    isProfile: false,
  },
  telegram: {
    label: "Telegram",
    hosts: ["t.me", "telegram.me"],
    paths: [/^\/[A-Za-z0-9_]{5,32}\/?$/],
    hint: "https://t.me/yourhandle",
    icon: "telegram",
    isProfile: false,
  },
  pinterest: {
    label: "Pinterest",
    hosts: ["pinterest.com", "in.pinterest.com", "uk.pinterest.com", "pinterest.co.uk"],
    paths: [new RegExp(`^/${HANDLE}/?$`)],
    hint: "https://pinterest.com/yourhandle",
    icon: "pinterest",
    isProfile: true,
  },
  threads: {
    label: "Threads",
    hosts: ["threads.net", "threads.com"],
    paths: [new RegExp(`^/@${HANDLE}/?$`)],
    hint: "https://threads.net/@yourhandle",
    icon: "threads",
    isProfile: true,
  },
  google_business: {
    label: "Google Business Profile",
    hosts: ["google.com", "maps.google.com", "g.page", "business.google.com", "maps.app.goo.gl"],
    paths: [/^\/maps(\/.*)?$/, /^\/[A-Za-z0-9._-]+\/?$/, /^\/n\/[A-Za-z0-9._-]+\/?$/, ANY],
    hint: "A Google Maps place link, https://g.page/… or a business.google.com share link",
    icon: "google",
    isProfile: true,
  },
  other: {
    label: "Other",
    hosts: [],
    paths: [ANY, /^\/$/],
    hint: "Any https:// URL",
    icon: "link",
    isProfile: true,
  },
};

/** Query parameters that never identify a profile and only leak campaign context. */
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|igshid$|igsh$|ref$|si$)/;

export type SocialUrlResult =
  { ok: true; url: string; platform: SocialPlatform } | { ok: false; error: string };

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

function hostMatches(host: string, allowed: readonly string[]): boolean {
  const bare = host.replace(/^www\./, "");
  return allowed.some((h) => bare === h);
}

/**
 * Validate and normalise a URL for `platform`. Accepts `instagram.com/handle` without a scheme
 * (adds `https://`); rejects `http:`, other hosts, and, for `google_business` on plain
 * `google.com`, anything outside `/maps`.
 */
export function validateSocialUrl(platform: SocialPlatform, raw: string): SocialUrlResult {
  const rule = PLATFORM_RULES[platform];
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter the profile URL" };
  if (trimmed.includes("{{")) return { ok: false, error: "Replace the {{PLACEHOLDER}} first" };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That is not a valid URL" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Use an https:// link" };
  if (url.username || url.password) return { ok: false, error: "Remove credentials from the URL" };
  const host = url.hostname.toLowerCase();
  if (rule.hosts.length > 0 && !hostMatches(host, rule.hosts)) {
    return { ok: false, error: `A ${rule.label} link must be on ${rule.hosts.join(", ")}` };
  }
  if (platform === "google_business" && host.replace(/^www\./, "") === "google.com") {
    if (!/^\/maps(\/.*)?$/.test(url.pathname)) {
      return { ok: false, error: "On google.com only a /maps place link is accepted" };
    }
  }
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const pathOk = rule.paths.some((p) => p.test(pathname === "/" ? "/" : pathname));
  if (!pathOk) return { ok: false, error: `Expected something like ${rule.hint}` };
  // Normalise: bare host for known platforms (their `www.` is optional), hash and tracking gone.
  url.hostname = platform === "other" ? host : host.replace(/^www\./, "");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.pathname = pathname === "/" ? "/" : pathname;
  let normalised = url.toString();
  if (normalised.endsWith("/") && url.pathname === "/" && !url.search) {
    normalised = normalised.slice(0, -1);
  }
  return { ok: true, url: normalised, platform };
}

/** Guess the platform from a pasted URL so the form can pre-select it. */
export function detectPlatform(raw: string): SocialPlatform | null {
  let host: string;
  try {
    host = new URL(/^[a-z]+:/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const platform of SOCIAL_PLATFORMS) {
    if (platform === "other") continue;
    if (hostMatches(host, PLATFORM_RULES[platform].hosts)) return platform;
  }
  return null;
}

/** The `sameAs` array the Person / ProfessionalService schema would emit for these rows. */
export function sameAsPreview(
  links: readonly {
    url: string;
    isVisible: boolean;
    includeInSameas: boolean;
    sortOrder: number;
  }[],
): string[] {
  return [...links]
    .filter((l) => l.isVisible && l.includeInSameas && !l.url.includes("{{"))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((l) => l.url);
}
