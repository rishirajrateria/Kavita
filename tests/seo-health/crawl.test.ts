/**
 * The crawler against a fake site: sitemap seeding, orphan detection, broken links, redirect
 * chains and loops, duplicates, the page ceiling, the budget pause and the resume.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { crossPageFindings } from "@/lib/seo-health/checks";
import { createCrawlState, runCrawlSegment } from "@/lib/seo-health/crawl";
import type { Finding } from "@/lib/seo-health/types";
import { fakeSite, html, ORIGIN, page, redirect, sitemap, sitemapIndex, xml } from "./fixtures";

const byType = (list: Finding[], type: string) => list.filter((f) => f.type === type);

function site() {
  const good = (h1: string, links: string[], extra: Parameters<typeof page>[0] = {}) =>
    html(
      200,
      page({
        title: `${h1} | Vedic Astrology & Vastu — Kavita`,
        description: `${h1}: book an integrated Vedic astrology and vastu consultation with Astrologer Kavita, online worldwide or in person.`,
        h1: [h1],
        links,
        words: 800,
        ...extra,
      }),
    );
  return fakeSite({
    "/": () =>
      good("Home page", [
        "/about",
        "/services",
        "/old",
        "/missing",
        "/chain",
        "/loop",
        "/dup-a",
        "/dup-b",
      ]),
    "/about": () => good("About Kavita", ["/", "/services"]),
    "/services": () => good("Services", ["/about"]),
    "/old": () => redirect("/about"),
    "/chain": () => redirect("/chain-2"),
    "/chain-2": () => redirect("/chain-3", 302),
    "/chain-3": () => redirect("/about"),
    "/loop": () => redirect("/loop-b"),
    "/loop-b": () => redirect("/loop"),
    "/dup-a": () =>
      good("Duplicate A", [], {
        title: "Same title everywhere on the site",
        description: "Same description ".repeat(9),
      }),
    "/dup-b": () =>
      good("Duplicate B", [], {
        title: "Same title everywhere on the site",
        description: "Same description ".repeat(9),
      }),
    "/orphan": () => good("Orphan page", []),
    "/noindex-listed": () => good("Noindex page", [], { robots: "noindex, follow" }),
    "/sitemap.xml": () =>
      xml(sitemapIndex([`${ORIGIN}/sitemap-pages.xml`, `${ORIGIN}/sitemap-learn.xml`])),
    "/sitemap-pages.xml": () =>
      xml(
        sitemap([`${ORIGIN}/`, `${ORIGIN}/about`, `${ORIGIN}/orphan`, `${ORIGIN}/noindex-listed`]),
      ),
    "/sitemap-learn.xml": () => xml(sitemap([`${ORIGIN}/services`])),
  });
}

export async function runCrawl() {
  const { fetchFn, hits } = site();
  const state = createCrawlState(ORIGIN, []);
  check(
    state.queue.includes("/") && state.queue.includes("/about"),
    "seeded with / and the route registry",
  );

  const result = await runCrawlSegment(state, {
    fetch: fetchFn,
    budgetMs: 20_000,
    scoreCitability: async () => ({ score: 30, fixes: ["Add a key-facts block"] }),
  });
  check(result.done, "crawl completes");
  check(
    state.seeded && state.sitemapPaths.includes("/orphan"),
    "sitemap files loaded (index + children)",
  );
  check(state.visited.includes("/orphan"), "sitemap-only page was crawled");
  check(
    !hits.some((h) => h.startsWith("/admin") || h.startsWith("/api")),
    "never fetched admin/api",
  );
  equal(
    hits.filter((h) => h === "/services").length,
    1,
    "each page fetched once (redirect targets excepted)",
  );

  const pageLevel = result.findings;
  check(
    byType(pageLevel, "redirect_chain").some((f) => f.path === "/chain"),
    "redirect_chain on /chain",
  );
  check(
    byType(pageLevel, "redirect_loop").some((f) => f.path === "/loop"),
    "redirect_loop on /loop",
  );
  check(
    byType(pageLevel, "http_error").some((f) => f.path === "/missing"),
    "404 recorded as http_error",
  );
  check(byType(pageLevel, "citability_low").length > 0, "citability scorer consulted");
  check(
    pageLevel.every((f) => f.fixHref !== undefined),
    "fix links attached",
  );

  const cross = crossPageFindings(state);
  const broken = byType(cross, "broken_link");
  check(
    broken.some((f) => f.path === "/" && f.details?.href === "/missing"),
    "broken_link attributed to the linking page",
  );
  check(
    byType(cross, "orphan_page").some((f) => f.path === "/orphan"),
    "orphan detected",
  );
  check(
    !byType(cross, "orphan_page").some((f) => f.path === "/about"),
    "linked sitemap page is not orphan",
  );
  check(
    byType(cross, "noindex_in_sitemap").some((f) => f.path === "/noindex-listed"),
    "noindex_in_sitemap",
  );
  check(
    byType(cross, "not_in_sitemap").some((f) => f.path === "/dup-a"),
    "not_in_sitemap for crawled indexable page",
  );
  equal(byType(cross, "title_duplicate").length, 2, "title_duplicate on both pages");
  equal(byType(cross, "description_duplicate").length, 2, "description_duplicate on both pages");
  check(
    byType(cross, "link_to_redirect").some(
      (f) => f.path === "/old" && f.details?.redirectsTo === "/about",
    ),
    "link_to_redirect",
  );
  check(
    !byType(cross, "title_duplicate").some((f) => f.path === "/old"),
    "redirected paths excluded from duplicate groups",
  );

  // Budget pause + resume: a zero budget crawls nothing new after the first check.
  const paused = createCrawlState(ORIGIN, []);
  let tick = 0;
  const r1 = await runCrawlSegment(paused, {
    fetch: site().fetchFn,
    budgetMs: 1,
    now: () => (tick += 10),
  });
  check(!r1.done, "zero budget pauses");
  const r2 = await runCrawlSegment(paused, { fetch: site().fetchFn, budgetMs: 20_000 });
  check(r2.done, "resumed crawl finishes");
  check(paused.visited.includes("/dup-b"), "resumed crawl reached the rest of the site");

  // Page ceiling
  const capped = createCrawlState(ORIGIN, []);
  const r3 = await runCrawlSegment(capped, {
    fetch: site().fetchFn,
    budgetMs: 20_000,
    maxPages: 3,
  });
  check(r3.done && capped.visited.length <= 3, `page ceiling respected (${capped.visited.length})`);

  // Concurrency never exceeds the limit
  let inFlight = 0;
  let peak = 0;
  const slow = site();
  const slowFetch = async (url: string, init?: RequestInit) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    try {
      return await slow.fetchFn(url, init);
    } finally {
      inFlight -= 1;
    }
  };
  await runCrawlSegment(createCrawlState(ORIGIN, []), {
    fetch: slowFetch,
    budgetMs: 20_000,
    concurrency: 4,
  });
  check(peak <= 4 && peak >= 2, `concurrency between 2 and 4 (peak ${peak})`);
}
