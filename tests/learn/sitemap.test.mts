/** The learn sitemap lists every hub, article and term with a well-formed `lastmod`. */
import { getArticles, getGlossaryTerms } from "@/lib/articles";
import { learnSitemapEntries, renderUrlset } from "@/lib/sitemaps";
import { check } from "./_assert.mjs";

export function run(): void {
  const entries = learnSitemapEntries();
  const locs = entries.map((e) => e.loc);
  const has = (path: string) => locs.some((l) => l.endsWith(path));
  check(has("/learn"), "learn sitemap lists /learn");
  check(has("/glossary"), "learn sitemap lists /glossary");
  for (const a of getArticles()) check(has(a.href), `learn sitemap lists ${a.href}`);
  for (const t of getGlossaryTerms())
    check(has(`/glossary/${t.slug}`), `learn sitemap lists ${t.slug}`);
  check(
    entries.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.lastmod ?? "")),
    "every learn entry has a YYYY-MM-DD lastmod",
  );
  check(new Set(locs).size === locs.length, "learn sitemap has no duplicate locs");
  const xml = renderUrlset(entries);
  check(xml.includes("<urlset") && xml.includes("</urlset>"), "learn urlset renders");
}
