/**
 * Builders for `/llms.txt` and `/llms-full.txt` (CLAUDE.md §9.5).
 *
 * `llms.txt` is a structured markdown index built from the data layer. `llms-full.txt` is the
 * markdown of the core pages that exist plus the country geo pages, produced by fetching each
 * page's own HTML at request time and running it through the same HTML→markdown pipeline as
 * `/{path}.md`, so the two can never drift. Both routes are dynamic (they read the request
 * host), which also means nothing fetches itself during `next build`.
 */
import type { LocationRecord } from "@/content/locations/schema";
import type { Service, SiteSettings } from "@/lib/data/types";
import { listGeoPages, type GeoPage } from "@/lib/geo/pages";
import { isIndexable, listIndexableCoreRoutes, normalisePath, type CoreRoute } from "@/lib/routes";
import { getLlmsDocument, type LlmsDocumentConfig } from "@/lib/seo/documents";
import { fetchPageMarkdown } from "./fetch-page";

export interface LlmsTxtInput {
  siteUrl: string;
  settings: SiteSettings;
  services: Service[];
  countries: Pick<LocationRecord, "name">[];
  geoPages: GeoPage[];
  /** Admin-edited composition (`site_documents` key `llms`); absent = defaults. */
  document?: LlmsDocumentConfig | null;
}

/**
 * Core routes for llms.txt / llms-full.txt after the admin's document config: excluded paths
 * removed, extra (existing, indexable) paths added, explicit order first.
 */
export function llmsCoreRoutes(document: LlmsDocumentConfig | null | undefined): CoreRoute[] {
  const exclude = new Set((document?.excludePaths ?? []).map(normalisePath));
  const routes = listIndexableCoreRoutes().filter((r) => !exclude.has(r.path));
  for (const raw of document?.extraPaths ?? []) {
    const path = normalisePath(raw);
    if (!isIndexable(path) || routes.some((r) => r.path === path) || exclude.has(path)) continue;
    routes.push({
      path,
      label: path,
      exists: true,
      indexable: true,
      priority: 0.5,
      changefreq: "monthly",
    });
  }
  const order = (document?.order ?? []).map(normalisePath);
  const rank = (p: string) => (order.includes(p) ? order.indexOf(p) : order.length);
  return routes
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r.path) - rank(b.r.path) || a.i - b.i)
    .map((x) => x.r);
}

const leadLabel: Record<Service["lead"], string> = {
  astrology: "astrology-led",
  vastu: "vastu-led",
  integrated: "integrated astrology + vastu",
};

/** Geo pages of one family (stubs never reach `listGeoPages`), ordered country → state → city, then by name. */
function publishedGeo(geoPages: GeoPage[], service: GeoPage["service"]): GeoPage[] {
  const rank = { country: 0, state: 1, city: 2 } as const;
  return geoPages
    .filter((p) => p.service === service)
    .sort(
      (a, b) =>
        rank[a.location.type] - rank[b.location.type] ||
        a.location.name.localeCompare(b.location.name, "en"),
    );
}

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const { siteUrl, settings, services, countries, geoPages, document } = input;
  const abs = (path: string) => `${siteUrl}${path === "/" ? "" : path}`;
  const lines: string[] = [];

  lines.push("# Astrologer Kavita", "");
  const preamble = document?.preamble?.trim();
  lines.push(
    preamble
      ? `> ${preamble.replace(/\s*\n\s*/g, " ")}`
      : `> Astrologer Kavita is the practice of ${settings.practitionerName}, a Vedic astrologer and vastu consultant based in ${settings.city}, ${settings.country}. She reads a client's kundli (Vedic birth chart) and the vastu of their home or workplace together, in one consultation, online worldwide (video or phone)${settings.inPersonAvailable ? ` and in person in ${settings.city}` : ""}. Countries served: ${countries.map((c) => c.name).join(", ")}.`,
    "",
  );
  lines.push(
    "Astrology and vastu are traditional practices offered for guidance and reflection, not a substitute for medical, legal or financial advice. This file is generated from the site's data layer; the full text of the core pages is at /llms-full.txt.",
    "",
  );

  lines.push("## Services", "");
  for (const s of services) {
    lines.push(
      `- [${s.name}](${abs(`/services/${s.slug}`)}): ${s.shortDescription} (${leadLabel[s.lead]}, ${s.durationMinutes} min)`,
    );
  }
  lines.push("");

  lines.push("## Where she consults", "");
  const astro = publishedGeo(geoPages, "astrologer");
  const vastu = publishedGeo(geoPages, "vastu-consultant");
  const countriesAstro = astro.filter((p) => p.location.type === "country");
  const citiesAstro = astro.filter((p) => p.location.type === "city" && p.location.isFeatured);
  if (countriesAstro.length === 0 && citiesAstro.length === 0) {
    lines.push(`- Online worldwide; countries served: ${countries.map((c) => c.name).join(", ")}`);
  }
  for (const p of countriesAstro) {
    const counterpart = vastu.find((v) => v.path === p.path);
    lines.push(
      `- [Astrologer in ${p.location.name}](${abs(p.href)})` +
        (counterpart
          ? ` · [Vastu consultant in ${p.location.name}](${abs(counterpart.href)})`
          : ""),
    );
  }
  for (const p of citiesAstro) {
    const counterpart = vastu.find((v) => v.path === p.path);
    lines.push(
      `- [Astrologer in ${p.location.name}](${abs(p.href)})` +
        (counterpart
          ? ` · [Vastu consultant in ${p.location.name}](${abs(counterpart.href)})`
          : ""),
    );
  }
  lines.push("");

  lines.push("## Key pages", "");
  for (const r of llmsCoreRoutes(document)) {
    lines.push(
      `- [${r.label}](${abs(r.path)}): markdown at ${abs(r.path === "/" ? "/index.md" : `${r.path}.md`)}`,
    );
  }
  lines.push("");

  lines.push("## Optional", "");
  lines.push(`- [Full text of the core pages](${abs("/llms-full.txt")})`);
  lines.push(`- [Sitemap index](${abs("/sitemap.xml")})`);
  lines.push(
    `- Contact: ${settings.email}; phone ${settings.phone}; WhatsApp ${settings.whatsapp}`,
  );
  lines.push("");
  return lines.join("\n");
}

/** Paths concatenated into llms-full.txt: existing core routes + publishable (complete or partial) country geo pages. */
export async function llmsFullPaths(): Promise<string[]> {
  const document = await getLlmsDocument();
  const core = llmsCoreRoutes(document).map((r) => r.path);
  if (document?.includeCountryGeo === false) return core;
  const geo = (await listGeoPages())
    .filter((p) => p.location.type === "country")
    .map((p) => p.href);
  return [...core, ...geo];
}

/** Fetch every page and join the markdown with `---` separators; failed pages are skipped. */
export async function buildLlmsFull(origin: string, siteUrl: string): Promise<string> {
  const paths = await llmsFullPaths();
  const parts: string[] = [];
  for (const path of paths) {
    const result = await fetchPageMarkdown(origin, path);
    if (!result.page) continue;
    const source = `${siteUrl}${path === "/" ? "" : path}`;
    parts.push(`# ${result.page.title || source}\n\nSource: ${source}\n\n${result.page.body}`);
  }
  return `${parts.join("\n\n---\n\n")}\n`;
}
