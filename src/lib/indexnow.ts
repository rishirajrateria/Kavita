/**
 * IndexNow (CLAUDE.md §8): ping Bing (and every IndexNow participant) on publish/update.
 * Server-only — reads `INDEXNOW_KEY`. The key is also served at `/<key>.txt` (proxy rewrite to
 * `src/app/api/indexnow/key`) so the endpoint can verify ownership.
 */
import { getSiteUrl } from "@/lib/site";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** Protocol limit per submission. */
export const INDEXNOW_MAX_URLS = 10_000;

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export interface IndexNowResult {
  submitted: number;
  /** `null` when nothing was sent (no key, or no URLs). */
  status: number | null;
  ok: boolean;
  message: string;
}

/** The configured key, or `undefined`; a key is 8–128 hex/alphanumeric characters. */
export function getIndexNowKey(): string | undefined {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : undefined;
}

/** Path of the key file for a key: `/<key>.txt`. */
export const indexNowKeyPath = (key: string) => `/${key}.txt`;

/**
 * Pure payload builder: absolutises relative paths, drops anything not on this site, dedupes,
 * caps at the protocol maximum. Unit-tested without network.
 */
export function buildIndexNowPayload(
  urls: readonly string[],
  key: string,
  siteUrl: string = getSiteUrl(),
): IndexNowPayload {
  const origin = new URL(siteUrl);
  const list = new Set<string>();
  for (const raw of urls) {
    // Site-relative paths or absolute URLs only — a bare word is a mistake, not a page.
    if (!raw.startsWith("/") && !/^https?:\/\//i.test(raw)) continue;
    let url: URL;
    try {
      url = new URL(raw, origin);
    } catch {
      continue;
    }
    if (url.origin !== origin.origin) continue;
    url.hash = "";
    list.add(url.toString());
    if (list.size >= INDEXNOW_MAX_URLS) break;
  }
  return {
    host: origin.host,
    key,
    keyLocation: `${origin.origin}${indexNowKeyPath(key)}`,
    urlList: [...list],
  };
}

/**
 * Submit URLs to IndexNow. A no-op (with a logged warning) when `INDEXNOW_KEY` is unset, so
 * previews and local builds never ping a search engine by accident.
 */
export async function submitIndexNow(
  urls: readonly string[],
  fetchImpl: typeof fetch = fetch,
): Promise<IndexNowResult> {
  const key = getIndexNowKey();
  if (!key) {
    console.warn(
      "[indexnow] INDEXNOW_KEY is not set; skipping submission of",
      urls.length,
      "URL(s)",
    );
    return { submitted: 0, status: null, ok: false, message: "INDEXNOW_KEY not configured" };
  }
  const payload = buildIndexNowPayload(urls, key);
  if (payload.urlList.length === 0) {
    return { submitted: 0, status: null, ok: false, message: "no URLs on this host to submit" };
  }
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  // IndexNow answers 200 (ok) or 202 (accepted, key validation pending) on success.
  const ok = response.status === 200 || response.status === 202;
  return {
    submitted: payload.urlList.length,
    status: response.status,
    ok,
    message: ok ? "submitted" : `IndexNow responded ${response.status}`,
  };
}
