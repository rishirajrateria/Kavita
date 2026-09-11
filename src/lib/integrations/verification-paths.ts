/**
 * The verification-file allow-list, kept in its own dependency-free module so `src/proxy.ts`
 * can import it without pulling Drizzle and the database client into the proxy bundle.
 * Deliberately narrow — only the names the engines actually hand out — so the admin can never
 * publish an arbitrary file at the site root.
 */

export const VERIFICATION_FILE_PATTERN =
  /^\/(google[a-f0-9]{8,32}\.html|BingSiteAuth\.xml|pinterest-[a-z0-9]{4,40}\.html|yandex_[a-f0-9]{6,40}\.html)$/i;

/** Forwarded by the proxy rewrite so `/api/verify` sees the original public path. */
export const VERIFY_PATH_HEADER = "x-ak-verify-path";

export function contentTypeFor(path: string): string {
  if (path.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  return "text/plain; charset=utf-8";
}
