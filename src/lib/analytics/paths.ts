/**
 * Path sanitising for stored analytics. Query strings and fragments are dropped, and any
 * segment that looks like a secret (booking manage tokens, signed upload ids) is replaced with
 * `:token`, so a URL such as `/book/manage/<token>` can never leak into the dashboard.
 */
const TOKEN_SEGMENT = /^[A-Za-z0-9_-]{24,}$/;
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalisePath(input: string): string {
  let path = input.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return "/";
    }
  }
  const cut = path.search(/[?#]/);
  if (cut >= 0) path = path.slice(0, cut);
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const segments = path
    .split("/")
    .map((s) => (TOKEN_SEGMENT.test(s) || UUID_SEGMENT.test(s) ? ":token" : s));
  const out = segments.join("/") || "/";
  return out.length > 512 ? out.slice(0, 512) : out;
}

export function isGeoPagePath(path: string): boolean {
  return path.startsWith("/astrologer/") || path.startsWith("/vastu-consultant/");
}
