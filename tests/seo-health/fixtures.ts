/** Fixture HTML for the SEO health parser and checks. */

export const ORIGIN = "http://site.test";

export function page(opts: {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  robots?: string;
  h1?: string[];
  body?: string;
  links?: string[];
  jsonLd?: string[];
  images?: string[];
  words?: number;
}): string {
  const {
    title = "Astrologer in Mumbai | Vedic Astrology & Vastu — Kavita",
    description = "Book an integrated Vedic astrology and vastu consultation in Mumbai with Astrologer Kavita: birth chart plus the vastu of your home, online or in person.",
    canonical,
    robots,
    h1 = ["Astrologer in Mumbai"],
    body = "",
    links = [],
    jsonLd = ['{"@context":"https://schema.org","@type":"BreadcrumbList"}'],
    images = [],
    words = 0,
  } = opts;
  const filler =
    words > 0 ? `<p>${Array.from({ length: words }, (_, i) => `word${i}`).join(" ")}</p>` : "";
  return `<!doctype html><html><head>
${title === null ? "" : `<title>${title}</title>`}
${description === null ? "" : `<meta name="description" content="${description}">`}
${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
${robots ? `<meta name="robots" content="${robots}">` : ""}
${jsonLd.map((j) => `<script type="application/ld+json">${j}</script>`).join("\n")}
</head><body>
<header><nav><a href="/">Home</a><a href="/about">About</a></nav></header>
<main>
${h1.map((h) => `<h1>${h}</h1>`).join("")}
${body}
${filler}
${links.map((l) => `<a href="${l}">${l}</a>`).join("")}
${images.join("")}
</main>
<footer><a href="/privacy">Privacy</a></footer>
</body></html>`;
}

export const html = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(status >= 300 && status < 400 ? null : body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });

export const redirect = (to: string, status = 301) =>
  new Response(null, { status, headers: { location: to } });

export const xml = (body: string) =>
  new Response(body, { status: 200, headers: { "content-type": "application/xml" } });

export function sitemap(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls
    .map((u) => `<url><loc>${u}</loc></url>`)
    .join("")}</urlset>`;
}

export function sitemapIndex(files: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex>${files
    .map((u) => `<sitemap><loc>${u}</loc></sitemap>`)
    .join("")}</sitemapindex>`;
}

/**
 * A fake site: `routes` maps a path to a response factory. Unknown paths answer 404.
 * `hits` records every requested path so tests can assert politeness/idempotence.
 */
export function fakeSite(routes: Record<string, () => Response>) {
  const hits: string[] = [];
  const fetchFn = async (url: string, _init?: RequestInit): Promise<Response> => {
    const { pathname } = new URL(url);
    hits.push(pathname);
    const factory = routes[pathname];
    return factory ? factory() : html(404, page({ title: "Not found", h1: ["Not found"] }));
  };
  return { fetchFn, hits };
}
