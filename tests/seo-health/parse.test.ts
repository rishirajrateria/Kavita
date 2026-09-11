/** Parser and per-page checks on fixture HTML: one case per finding type. */
import { check, equal } from "../seo-plumbing/_assert";
import { pageFindings, type PageCheckInput } from "@/lib/seo-health/checks";
import { fixFor } from "@/lib/seo-health/fix-links";
import {
  isCrawlablePath,
  parsePage,
  parseSitemapLocs,
  resolveInternalHref,
} from "@/lib/seo-health/parse";
import { finding, type Finding, type SeoFindingType } from "@/lib/seo-health/types";
import { ORIGIN, page } from "./fixtures";

const types = (list: Finding[]) => list.map((f) => f.type).sort();
const has = (list: Finding[], type: SeoFindingType) => list.some((f) => f.type === type);

function run(
  html: string,
  path = "/astrologer/india/maharashtra/mumbai",
  extra: Partial<PageCheckInput> = {},
) {
  const parsed = parsePage(html, ORIGIN, path);
  return pageFindings({
    path,
    origin: ORIGIN,
    status: 200,
    hops: [],
    redirectFailed: false,
    parsed,
    citability: null,
    ...extra,
  });
}

export function runParse() {
  // A healthy geo page raises only thin_content (fixtures carry no prose) — nothing else.
  const healthy = parsePage(
    page({ words: 800, jsonLd: ['{"@type":"FAQPage"}'] }),
    ORIGIN,
    "/astrologer/india",
  );
  equal(healthy.title, "Astrologer in Mumbai | Vedic Astrology & Vastu — Kavita", "title parsed");
  check((healthy.description ?? "").startsWith("Book an integrated"), "description parsed");
  equal(healthy.h1Count, 1, "one h1");
  equal(healthy.h1, "Astrologer in Mumbai", "h1 text");
  equal(healthy.jsonLdTypes.join(","), "FAQPage", "json-ld types");
  check(healthy.words >= 800, `word count counts main only (${healthy.words})`);
  check(
    healthy.links.includes("/privacy"),
    "chrome links count as links (crawlers follow nav and footer)",
  );
  equal(
    types(run(page({ words: 800, jsonLd: ['{"@type":"FAQPage"}'] }))).length,
    0,
    "healthy page has no findings",
  );

  // Title
  check(has(run(page({ title: null })), "title_missing"), "title_missing");
  check(has(run(page({ title: "Short" })), "title_length"), "title_length short");
  check(has(run(page({ title: "x".repeat(70) })), "title_length"), "title_length long");

  // Description
  check(has(run(page({ description: null })), "description_missing"), "description_missing");
  check(has(run(page({ description: "Too short." })), "description_length"), "description_length");

  // H1
  check(has(run(page({ h1: [] })), "h1_missing"), "h1_missing");
  check(has(run(page({ h1: ["One", "Two"] })), "h1_multiple"), "h1_multiple");

  // Images
  const imgs = run(
    page({
      images: [
        '<img src="/a.jpg">',
        '<img src="/b.jpg" alt="">',
        '<img src="/c.jpg" alt="Kavita">',
        '<img src="/d.jpg" role="presentation">',
      ],
    }),
  );
  const alt = imgs.find((f) => f.type === "image_alt_missing");
  check(
    Boolean(alt) && alt?.details?.count === 1,
    "image_alt_missing counts only images with no alt attribute",
  );

  // JSON-LD
  check(has(run(page({ jsonLd: [] })), "jsonld_missing"), "jsonld_missing");
  check(has(run(page({ jsonLd: ["{not json"] })), "jsonld_invalid"), "jsonld_invalid");
  check(
    has(run(page({ jsonLd: ['{"@graph":[{"@type":"WebPage"}]}'] })), "faqpage_missing"),
    "faqpage_missing on geo page",
  );
  check(
    !has(run(page({ jsonLd: ['{"@graph":[{"@type":"WebPage"}]}'] }), "/about"), "faqpage_missing"),
    "faqpage not required on /about",
  );

  // Canonical
  check(
    has(run(page({ canonical: "http://site.test/astrologer/india" })), "canonical_mismatch"),
    "canonical_mismatch",
  );
  check(
    !has(
      run(page({ canonical: "http://site.test/astrologer/india/maharashtra/mumbai/" })),
      "canonical_mismatch",
    ),
    "canonical trailing slash tolerated",
  );

  // Thin content
  const thin = run(page({ words: 100 }));
  const t = thin.find((f) => f.type === "thin_content");
  check(t?.details?.floor === 700, "thin_content geo floor 700");
  check(
    run(page({ words: 350 }), "/about").every((f) => f.type !== "thin_content"),
    "350 words is fine on /about",
  );
  check(
    !has(run(page({ words: 10, robots: "noindex" })), "thin_content"),
    "noindex pages are not held to the floor",
  );

  // Citability
  check(
    has(
      run(page({}), "/about", { citability: { score: 40, fixes: ["Add a table"] } }),
      "citability_low",
    ),
    "citability_low",
  );
  check(
    !has(run(page({}), "/about", { citability: { score: 80, fixes: [] } }), "citability_low"),
    "citability ok",
  );

  // HTTP + redirects
  check(has(run(page({}), "/x", { status: 404, parsed: null }), "http_error"), "http_error 404");
  check(
    has(run(page({}), "/x", { status: 0, parsed: null }), "http_error"),
    "http_error unreachable",
  );
  check(has(run(page({}), "/x", { hops: ["/y", "/z"] }), "redirect_chain"), "redirect_chain");
  check(!has(run(page({}), "/x", { hops: ["/y"] }), "redirect_chain"), "single hop is not a chain");
  const loop = run(page({}), "/x", { hops: ["/y", "/x"], redirectFailed: true });
  equal(types(loop).join(","), "redirect_loop", "redirect_loop only");

  // Links + crawlability
  equal(resolveInternalHref("/faq?q=x#top", ORIGIN, "/"), "/faq", "query/hash stripped");
  equal(resolveInternalHref("about", ORIGIN, "/learn/"), "/learn/about", "relative resolved");
  equal(resolveInternalHref("https://other.test/x", ORIGIN, "/"), null, "external dropped");
  equal(resolveInternalHref("mailto:a@b.c", ORIGIN, "/"), null, "mailto dropped");
  check(
    !isCrawlablePath("/admin/health") &&
      !isCrawlablePath("/_next/x.js") &&
      !isCrawlablePath("/x.png"),
    "skips admin/next/files",
  );
  check(isCrawlablePath("/astrologer/india") && isCrawlablePath("/book"), "crawls pages");
  equal(
    parseSitemapLocs(
      "<urlset><url><loc>http://s/a</loc></url><url><loc> http://s/b </loc></url></urlset>",
    ).join(","),
    "http://s/a,http://s/b",
    "sitemap locs",
  );

  // Fix links
  equal(fixFor(finding("/about", "title_length", "")), "/admin/seo/about", "seo editor link");
  equal(fixFor(finding("/", "h1_missing", "")), "/admin/seo/home", "home editor link");
  equal(
    fixFor(finding("/about", "broken_link", "", { href: "/old" })),
    "/admin/redirects?prefill=%2Fold",
    "redirect prefill",
  );
  equal(
    fixFor(finding("/astrologer/india/delhi", "thin_content", "")),
    "/admin/content/locations/india/delhi",
    "geo thin → location editor",
  );
  equal(fixFor(finding("/services/kundli", "faqpage_missing", "")), "/admin/faqs", "faq manager");
  equal(fixFor(finding("/about", "citability_low", "")), "/admin/aeo?route=%2Fabout", "aeo panel");
  equal(fixFor(finding("/about", "orphan_page", "")), "/admin/sitemaps", "sitemaps");
}
