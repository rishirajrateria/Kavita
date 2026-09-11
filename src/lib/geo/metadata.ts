/**
 * `<head>` metadata for a geo page (CLAUDE.md §8): title under 60 characters where possible,
 * a 150–160 character description naming the place and the combined-method differentiator,
 * an absolute self-referencing canonical, `noindex` for `partial` research, a reciprocal
 * hreflang cluster on country pages, and the on-brand OG image from `/api/og`.
 */
import type { Metadata } from "next";
import { HREFLANGS, type Hreflang, type LocationRecord } from "@/content/locations/schema";
import { getPublishableLocations, locationHref } from "@/lib/data/locations";
import type { GeoService } from "@/lib/data/types";
import { GEO_SERVICE_META, geoH1 } from "./service";

export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 150;
export const DESCRIPTION_MAX = 160;
const BRAND = "Astrologer Kavita";

/** Country code → hreflang, so state and city pages can carry the right OG locale. */
const HREFLANG_BY_COUNTRY: Record<string, Hreflang> = {
  IN: "en-IN",
  US: "en-US",
  GB: "en-GB",
  AE: "en-AE",
  CA: "en-CA",
  AU: "en-AU",
  SG: "en-SG",
};

/**
 * `Astrologer in {City} | Vedic Astrology & Vastu — Astrologer Kavita`, shortened step by step
 * (short name, shorter tail, no tail) until it fits 60 characters. The last form is used even
 * when it does not fit, so the H1 phrase is never cut mid-word.
 */
export function buildGeoTitle(loc: LocationRecord, service: GeoService): string {
  const meta = GEO_SERVICE_META[service];
  const names =
    loc.shortName && loc.shortName !== loc.name ? [loc.name, loc.shortName] : [loc.name];
  const forms: string[] = [];
  for (const tail of [meta.titleTail, meta.titleTailShort]) {
    for (const name of names) forms.push(`${meta.label} in ${name} | ${tail} — ${BRAND}`);
  }
  for (const name of names) forms.push(`${meta.label} in ${name} — ${BRAND}`);
  return forms.find((f) => f.length <= TITLE_MAX) ?? forms[forms.length - 1]!;
}

/**
 * Choose the base form and the subset of optional clauses that lands the description inside
 * 150–160 characters (closest to the top of the range); otherwise the longest form under 160.
 */
export function fitDescription(bases: readonly string[], tails: readonly string[]): string {
  let best = bases[0] ?? "";
  let bestScore = score(best.length);
  const n = tails.length;
  for (const base of bases) {
    for (let mask = 0; mask < 1 << n; mask += 1) {
      const text = base + tails.filter((_, i) => mask & (1 << i)).join("");
      if (text.length > DESCRIPTION_MAX) continue;
      const s = score(text.length);
      if (s > bestScore) {
        best = text;
        bestScore = s;
      }
    }
  }
  return best;
}

/** Higher is better: in range beats out of range; within range, longer is better. */
function score(length: number): number {
  if (length > DESCRIPTION_MAX) return -Infinity;
  return length >= DESCRIPTION_MIN ? 1000 + length : length;
}

export function buildGeoDescription(loc: LocationRecord, service: GeoService): string {
  const names =
    loc.shortName && loc.shortName !== loc.name ? [loc.name, loc.shortName] : [loc.name];
  const where = (n: string) => (loc.type === "country" ? `across ${n}` : `in ${n}`);
  const bases: string[] = [];
  const tails: string[] =
    service === "astrologer"
      ? [
          " Online.",
          " Worldwide.",
          " Video or phone.",
          " In your local hours.",
          " Written summary after.",
        ]
      : [
          " Online.",
          " Worldwide.",
          " Apartments too.",
          " In your local hours.",
          " No demolition first.",
        ];
  for (const n of names) {
    if (service === "astrologer") {
      bases.push(
        `Vedic astrologer for clients ${where(n)}: Astrologer Kavita reads your kundli (birth chart) and the vastu of your home together in one consultation.`,
        `Vedic astrologer ${where(n)}: Astrologer Kavita reads your kundli and the vastu of your home together, in one consultation.`,
      );
    } else {
      bases.push(
        `Vastu consultant for homes ${where(n)}: Astrologer Kavita reads your floor plan with your birth chart, so the remedies fit the people who live there.`,
        `Vastu consultant ${where(n)}: Astrologer Kavita reads your floor plan with your birth chart, so remedies fit the people living there.`,
      );
    }
  }
  return fitDescription(bases, tails);
}

export function ogImageUrl(
  siteUrl: string,
  loc: LocationRecord,
  service: GeoService,
  subtitle: string,
): string {
  const params = new URLSearchParams({
    title: geoH1(loc, service),
    subtitle,
    kind: GEO_SERVICE_META[service].ogKind,
  });
  return `${siteUrl}/api/og?${params.toString()}`;
}

/**
 * hreflang cluster for a country page: every PUBLISHABLE country of the same service, each
 * listing every other (reciprocal), plus `x-default`. The hubs `/astrology` and `/vastu` do not
 * exist until Phase 3, so `x-default` points at the India page — the primary market — falling
 * back to the first published country if India is not yet published.
 */
export async function hreflangCluster(
  service: GeoService,
  siteUrl: string,
): Promise<Record<string, string> | undefined> {
  const countries = (await getPublishableLocations()).filter((l) => l.type === "country");
  if (countries.length === 0) return undefined;
  const languages: Record<string, string> = {};
  for (const code of HREFLANGS) {
    const country = countries.find((c) => c.hreflang === code);
    if (country) languages[code] = `${siteUrl}${locationHref(country, service)}`;
  }
  const india = countries.find((c) => c.countryCode === "IN") ?? countries[0]!;
  languages["x-default"] = `${siteUrl}${locationHref(india, service)}`;
  return languages;
}

export async function buildGeoMetadata(
  loc: LocationRecord,
  service: GeoService,
  siteUrl: string,
): Promise<Metadata> {
  const title = buildGeoTitle(loc, service);
  const description = buildGeoDescription(loc, service);
  const canonical = `${siteUrl}${locationHref(loc, service)}`;
  const hreflang = HREFLANG_BY_COUNTRY[loc.countryCode] ?? "en-IN";
  const ogAlt = `${geoH1(loc, service)} — ${BRAND}`;
  const image = ogImageUrl(siteUrl, loc, service, GEO_SERVICE_META[service].titleTail);
  const languages = loc.type === "country" ? await hreflangCluster(service, siteUrl) : undefined;
  const indexable = loc.researchStatus === "complete";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: BRAND,
      locale: hreflang.replace("-", "_"),
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
