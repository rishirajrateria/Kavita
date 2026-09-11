/**
 * Coarse location from the platform edge headers (Vercel sets them on every request; nothing
 * is looked up from the IP by this code). City-level at most, never coordinates.
 */
export interface GeoInfo {
  country: string | null;
  region: string | null;
  city: string | null;
}

function decode(value: string | null): string | null {
  if (!value) return null;
  let out = value.trim();
  try {
    out = decodeURIComponent(out);
  } catch {
    // keep the raw value
  }
  out = out.replace(/[\x00-\x1f\x7f]/g, "").trim();
  return out.length > 0 ? out.slice(0, 80) : null;
}

export function geoFromHeaders(headers: Headers): GeoInfo {
  const country = decode(headers.get("x-vercel-ip-country"))?.toUpperCase() ?? null;
  return {
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    region: decode(headers.get("x-vercel-ip-country-region")),
    city: decode(headers.get("x-vercel-ip-city")),
  };
}
