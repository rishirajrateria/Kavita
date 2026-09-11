/**
 * The pure metadata merge: an override (and the social templates) folded over the metadata a
 * page builds for itself (Phase 6 P6-A).
 */
import type { Metadata } from "next";
import { check, equal } from "../seo-plumbing/_assert";
import type { PageSeoRow } from "@/db/schema/seo";
import {
  contentTypeForRoute,
  mergePageSeo,
  ogImageForRow,
  robotsFromRow,
  pageSeoExtras,
} from "@/lib/seo/page-seo";

const SITE = "https://example.com";

function row(partial: Partial<PageSeoRow> = {}): PageSeoRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    routePattern: "/about",
    title: null,
    metaDescription: null,
    h1Override: null,
    canonicalUrl: null,
    noindex: false,
    nofollow: false,
    robots: null,
    ogTitle: null,
    ogDescription: null,
    ogImageUrl: null,
    ogType: null,
    ogText: null,
    twitterCard: null,
    twitterTitle: null,
    twitterDescription: null,
    twitterImageUrl: null,
    keywordFocus: null,
    customHeadHtml: null,
    hreflang: null,
    structuredDataOverrides: null,
    isActive: true,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    ...partial,
  };
}

const BASE: Metadata = {
  title: { absolute: "Page title from the page" },
  description: "Description from the page",
  alternates: { canonical: `${SITE}/about` },
  robots: { index: true, follow: true },
  openGraph: { type: "website", title: "Page title from the page", siteName: "Astrologer Kavita" },
  twitter: { card: "summary_large_image" },
};

type Og = { title?: string; description?: string; images?: unknown; type?: string; url?: string };
type Tw = { card?: string; title?: string; description?: string; images?: string[] };

export function run() {
  // No row and no templates: the page's own metadata is untouched.
  const untouched = mergePageSeo(BASE, null, { siteUrl: SITE, route: "/about" });
  equal(untouched.description, BASE.description, "no override leaves the description alone");

  // Title / description / canonical.
  const merged = mergePageSeo(
    BASE,
    row({
      title: "Override title",
      metaDescription: "Override description",
      canonicalUrl: `${SITE}/about-us`,
    }),
    { siteUrl: SITE, route: "/about" },
  );
  equal(
    typeof merged.title === "object" && merged.title && "absolute" in merged.title
      ? merged.title.absolute
      : merged.title,
    "Override title",
    "the title override wins",
  );
  equal(merged.description, "Override description", "the description override wins");
  equal(
    (merged.alternates as { canonical?: string } | undefined)?.canonical,
    `${SITE}/about-us`,
    "the canonical override wins",
  );

  // Only-set fields are touched: an empty override keeps the page's own values.
  const empty = mergePageSeo(BASE, row(), { siteUrl: SITE, route: "/about" });
  equal(empty.description, BASE.description, "an empty override changes nothing");

  // Robots.
  const robots = robotsFromRow(
    row({ robots: { index: false, follow: true, maxSnippet: 120, maxImagePreview: "large" } }),
  );
  equal(robots.index, false, "index:false is emitted");
  equal(robots["max-snippet"], 120, "max-snippet is emitted");
  equal(robots["max-image-preview"], "large", "max-image-preview is emitted");
  equal(
    Object.keys(robotsFromRow(row())).length,
    0,
    "a row with no directives emits no robots keys",
  );
  equal(
    robotsFromRow(row({ noindex: true })).index,
    false,
    "the Phase 1 noindex boolean still works",
  );

  // Open Graph and Twitter, including the generated image.
  const social = mergePageSeo(
    BASE,
    row({ ogTitle: "Social title", ogText: "Astrologer in Mumbai", twitterCard: "summary" }),
    { siteUrl: SITE, route: "/astrologer/india/maharashtra/mumbai" },
  );
  equal((social.openGraph as Og).title, "Social title", "og:title override wins");
  const image = ((social.openGraph as Og).images as { url: string }[])[0]?.url ?? "";
  check(image.startsWith(`${SITE}/api/og?`), "og_text builds a generated image URL");
  check(image.includes("Astrologer+in+Mumbai"), "the og_text is passed to the generator");
  equal((social.twitter as Tw).card, "summary", "twitter:card override wins");
  equal(
    (social.twitter as Tw).title,
    "Social title",
    "twitter falls back to the OG title when unset",
  );
  equal(
    ogImageForRow(row({ ogImageUrl: "https://cdn.example/x.png", ogText: "ignored" }), SITE, "/x"),
    "https://cdn.example/x.png",
    "an explicit image URL beats the generator",
  );
  equal(ogImageForRow(row(), SITE, "/x"), null, "no image and no text means no override");

  // hreflang merges with whatever the page already declared.
  const withBase: Metadata = {
    ...BASE,
    alternates: { canonical: `${SITE}/astrologer/india`, languages: { "en-IN": `${SITE}/a` } },
  };
  const hreflang = mergePageSeo(withBase, row({ hreflang: { "x-default": `${SITE}/b` } }), {
    siteUrl: SITE,
    route: "/astrologer/india",
  });
  const languages = (hreflang.alternates as { languages?: Record<string, string> }).languages ?? {};
  equal(languages["en-IN"], `${SITE}/a`, "the page's own hreflang survives");
  equal(languages["x-default"], `${SITE}/b`, "the override adds x-default");

  // Custom head: canonical/alternate/meta are folded into Metadata, JSON-LD comes out as extras.
  const head = row({
    customHeadHtml:
      '<meta name="yandex-verification" content="abc">' +
      `<link rel="canonical" href="${SITE}/canonical-from-head">` +
      '<link rel="me" href="https://instagram.com/x">' +
      '<script type="application/ld+json">{"@type":"Course"}</script>',
  });
  const withHead = mergePageSeo(BASE, head, { siteUrl: SITE, route: "/about" });
  equal(
    (withHead.other as Record<string, string>)["yandex-verification"],
    "abc",
    "a verification meta becomes `other`",
  );
  equal(
    (withHead.alternates as { canonical?: string }).canonical,
    `${SITE}/canonical-from-head`,
    "a canonical link in the head wins",
  );
  const extras = pageSeoExtras(head);
  equal(extras.length, 2, "JSON-LD and rel=me are rendered as extras");
  check(
    extras.some((t) => t.kind === "jsonld"),
    "the JSON-LD block is an extra",
  );
  equal(pageSeoExtras(null).length, 0, "no row means no extras");

  // Social templates apply before the row, per content type.
  const templated = mergePageSeo(BASE, null, {
    siteUrl: SITE,
    route: "/astrologer/india",
    templates: { geo: { title: "{{title}} · {{brand}}" } },
  });
  equal(
    (templated.openGraph as Og).title,
    "Page title from the page · Astrologer Kavita",
    "the geo template fills the OG title",
  );
  const templatedOverridden = mergePageSeo(BASE, row({ ogTitle: "Row wins" }), {
    siteUrl: SITE,
    route: "/astrologer/india",
    templates: { geo: { title: "{{title}} · {{brand}}" } },
  });
  equal((templatedOverridden.openGraph as Og).title, "Row wins", "the row beats the template");

  // Content type routing.
  equal(contentTypeForRoute("/"), "home", "home");
  equal(contentTypeForRoute("/astrologer/india/maharashtra/mumbai"), "geo", "geo");
  equal(contentTypeForRoute("/vastu-consultant/united-arab-emirates"), "geo", "vastu geo");
  equal(contentTypeForRoute("/services/kundli-analysis"), "service", "service");
  equal(contentTypeForRoute("/learn/astrology-basics/what-is-a-dasha"), "article", "article");
  equal(contentTypeForRoute("/glossary/kundli"), "glossary", "glossary");
  equal(contentTypeForRoute("/contact"), "page", "everything else");
}
