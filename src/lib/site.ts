/**
 * Site URL helpers. Safe to import from server and client code: reads only the public
 * `NEXT_PUBLIC_SITE_URL` variable and never touches secrets.
 */

const FALLBACK_SITE_URL = "http://localhost:3000";

/** Absolute origin of the site without a trailing slash, e.g. `https://astrologerkavita.com`. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Absolute URL for a site path: `absoluteUrl("/about")` → `https://…/about`. */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return normalised === "/" ? base : `${base}${normalised}`;
}

/** True when a value is an unfilled `{{PLACEHOLDER}}` from the client data sheet. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes("{{");
}

/** The value, or `undefined` when it is empty or still a `{{PLACEHOLDER}}`. */
export function realValue(value: string | null | undefined): string | undefined {
  if (!value || isPlaceholder(value)) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** `tel:` href for a phone number, or `null` when the number is still a placeholder. */
export function telHref(phone: string | null | undefined): string | null {
  const value = realValue(phone);
  if (!value) return null;
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned.length >= 6 ? `tel:${cleaned}` : null;
}

/** `https://wa.me/<digits>` for a WhatsApp number, or `null` when it is still a placeholder. */
export function whatsappHref(value: string | null | undefined): string | null {
  const real = realValue(value);
  if (!real) return null;
  const digits = real.replace(/\D/g, "");
  return digits.length >= 6 ? `https://wa.me/${digits}` : null;
}

/** `mailto:` href, or `null` when the address is still a placeholder. */
export function mailtoHref(email: string | null | undefined): string | null {
  const value = realValue(email);
  return value && value.includes("@") ? `mailto:${value}` : null;
}
