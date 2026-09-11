/**
 * HTML → Markdown for the `/{path}.md` mirror and `/llms-full.txt` (CLAUDE.md §9.5–9.6).
 *
 * Takes the rendered HTML of a page, keeps `<main>` only, strips chrome (header, footer, nav,
 * scripts, styles, decorative SVG, `aria-hidden` nodes) and converts the rest with turndown.
 * Tables, definition lists and `<details>` FAQ blocks get explicit rules so answer engines see
 * them as structure, not as run-together text. Pure: no I/O, no Next imports.
 */
import TurndownService from "turndown";

export interface PageMarkdown {
  title: string;
  description?: string;
  canonical?: string;
  /** Markdown body (no front matter). */
  body: string;
}

const STRIP_TAGS = ["script", "style", "noscript", "template", "header", "footer", "nav", "svg"];

/** DOM node shape turndown hands to filters (domino on the server, DOM in browsers). */
interface DomNode {
  nodeName: string;
  nodeType: number;
  textContent: string | null;
  getAttribute?(name: string): string | null;
  querySelectorAll?(selector: string): ArrayLike<DomNode>;
  childNodes: ArrayLike<DomNode>;
}

const asDom = (node: unknown) => node as DomNode;

function cellText(cell: DomNode): string {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim().replaceAll("|", "\\|");
}

function renderTable(table: DomNode): string {
  const rows = Array.from(table.querySelectorAll?.("tr") ?? []);
  if (rows.length === 0) return "";
  const matrix = rows.map((row) =>
    Array.from(row.querySelectorAll?.("th, td") ?? []).map((cell) => cellText(cell)),
  );
  const width = Math.max(...matrix.map((r) => r.length));
  if (width === 0) return "";
  const pad = (r: string[]) => [...r, ...Array<string>(width - r.length).fill("")];
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  const first = matrix[0] ?? [];
  const [head, ...rest] = matrix;
  const lines = [line(head ?? first), `| ${Array<string>(width).fill("---").join(" | ")} |`];
  for (const r of rest) lines.push(line(r));
  return `\n\n${lines.join("\n")}\n\n`;
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    hr: "---",
  });
  td.remove(STRIP_TAGS as unknown as TurndownService.Filter);
  td.remove((node) => asDom(node).getAttribute?.("aria-hidden") === "true");

  // The Heading component's eyebrow lives inside the heading; keep it readable as a prefix.
  td.addRule("eyebrow", {
    filter: (node) => asDom(node).getAttribute?.("data-slot") === "eyebrow",
    replacement: (content) => (content.trim() ? `${content.trim()}: ` : ""),
  });
  td.addRule("table", {
    filter: "table",
    replacement: (_content, node) => renderTable(asDom(node)),
  });
  td.addRule("definition-term", {
    filter: "dt",
    replacement: (content) => `\n**${content.trim()}**  \n`,
  });
  td.addRule("definition-description", {
    filter: "dd",
    replacement: (content) => `${content.trim()}\n\n`,
  });
  td.addRule("summary", {
    filter: "summary",
    replacement: (content) => `\n\n**${content.trim()}**\n\n`,
  });
  td.addRule("details", {
    filter: "details",
    replacement: (content) => `\n\n${content.trim()}\n\n`,
  });
  return td;
}

let shared: TurndownService | undefined;

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&nbsp;", " ");
}

function attr(html: string, tagPattern: RegExp): string | undefined {
  const match = tagPattern.exec(html);
  return match?.[1] ? decodeEntities(match[1]).trim() : undefined;
}

/** `<title>` text without the site-name suffix the layout template appends. */
export function extractTitle(html: string): string {
  const raw = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "";
  return raw.replace(/\s+—\s+Astrologer Kavita\s*$/u, "").trim();
}

export function extractCanonical(html: string): string | undefined {
  return (
    attr(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ??
    attr(html, /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)
  );
}

export function extractDescription(html: string): string | undefined {
  return (
    attr(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) ??
    attr(html, /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i)
  );
}

/** The `<main>` element's inner HTML, or the whole document when there is none. */
export function extractMain(html: string): string {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return match?.[1] ?? html;
}

/** Convert a fragment of HTML to tidy markdown. */
export function htmlToMarkdown(html: string): string {
  shared ??= createTurndown();
  return shared
    .turndown(html)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Full page: title/description/canonical from `<head>`, body from `<main>`. */
export function pageToMarkdown(html: string): PageMarkdown {
  return {
    title: extractTitle(html),
    description: extractDescription(html),
    canonical: extractCanonical(html),
    body: htmlToMarkdown(extractMain(html)),
  };
}

const yamlString = (value: string) => JSON.stringify(value);

/** YAML front matter + body, as served by `/{path}.md`. */
export function renderMarkdownDocument(page: PageMarkdown, source: string): string {
  const lines = ["---", `title: ${yamlString(page.title)}`];
  if (page.description) lines.push(`description: ${yamlString(page.description)}`);
  if (page.canonical) lines.push(`canonical: ${page.canonical}`);
  lines.push(`source: ${source}`, "---", "", page.body, "");
  return lines.join("\n");
}
