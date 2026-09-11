/**
 * After every redirect write: drop this instance's cache immediately and ping
 * `POST /api/redirects/refresh` (fire-and-forget) so other instances reload before their TTL.
 * The ping is skipped, with no error, when `REDIRECT_REFRESH_SECRET` is unset.
 */
import { getRefreshSecret, invalidateRedirectCache } from "./cache";

export function afterRedirectWrite(request: Request): void {
  invalidateRedirectCache();
  const secret = getRefreshSecret();
  if (!secret) return;
  let target: URL;
  try {
    target = new URL("/api/redirects/refresh", request.url);
  } catch {
    return;
  }
  void fetch(target, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
    keepalive: true,
  }).catch(() => undefined);
}
