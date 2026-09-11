/**
 * Sanitiser for the per-page "custom head HTML" field (Phase 6 P6-A). Pure, no DOM.
 *
 * Only three things may pass: `<meta …>`, `<link …>` and `<script type="application/ld+json">`
 * whose body parses as JSON. Everything else — other tags, text, comments, event handlers,
 * `javascript:` URLs, `<link rel="stylesheet">` and `<link rel="import">` — is dropped and
 * reported in `warnings`, so the admin sees exactly what was removed and why.
 */

export interface SanitizedHead {
  html: string;
  warnings: string[];
  /** Parsed, allowed tags in document order — the same data the metadata mapper consumes. */
  tags: HeadTag[];
}

export type HeadTag =
  | { kind: "meta"; attrs: Record<string, string> }
  | { kind: "link"; attrs: Record<string, string> }
  | { kind: "jsonld"; json: unknown };

const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;
const BLOCKED_LINK_RELS = new Set(["stylesheet", "import", "prefetch", "prerender"]);
const URL_ATTRS = new Set(["href", "content", "src", "imagesrcset"]);

/** Parse an attribute string into a lower-cased map; drops `on*` handlers and dangerous URLs. */
export function parseAttributes(
  raw: string,
  warnings: string[],
  tag: string,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_RE)) {
    const name = (match[1] ?? "").toLowerCase();
    if (!name) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name.startsWith("on")) {
      warnings.push(`<${tag}>: removed event handler attribute "${name}"`);
      continue;
    }
    if (URL_ATTRS.has(name) && /^\s*(javascript|data|vbscript):/i.test(value)) {
      warnings.push(`<${tag}>: removed "${name}" with a ${value.split(":")[0]?.trim()}: URL`);
      continue;
    }
    attrs[name] = value;
  }
  return attrs;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function serializeTag(tag: HeadTag): string {
  if (tag.kind === "jsonld") {
    return `<script type="application/ld+json">${JSON.stringify(tag.json).replaceAll("<", "\\u003c")}</script>`;
  }
  const attrs = Object.entries(tag.attrs)
    .map(([k, v]) => (v === "" ? k : `${k}="${escapeAttr(v)}"`))
    .join(" ");
  return `<${tag.kind}${attrs ? ` ${attrs}` : ""}>`;
}

const TOKEN_RE =
  /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<(meta|link)\b([^>]*?)\/?>|<\/?([a-zA-Z][\w:-]*)\b[^>]*>|[^<]+|</g;

/** Sanitise a head snippet. Never throws; empty input yields empty output. */
export function sanitizeHeadHtml(input: string | null | undefined): SanitizedHead {
  const warnings: string[] = [];
  const tags: HeadTag[] = [];
  const source = (input ?? "").trim();
  if (!source) return { html: "", warnings, tags };

  for (const match of source.matchAll(TOKEN_RE)) {
    const [token, scriptAttrs, scriptBody, simpleTag, simpleAttrs, otherTag] = match;
    if (token.startsWith("<!--")) {
      warnings.push("removed an HTML comment");
      continue;
    }
    if (scriptAttrs !== undefined) {
      const attrs = parseAttributes(scriptAttrs, warnings, "script");
      if ((attrs.type ?? "").toLowerCase() !== "application/ld+json") {
        warnings.push(
          `<script>: only type="application/ld+json" is allowed (got "${attrs.type ?? "none"}")`,
        );
        continue;
      }
      try {
        tags.push({ kind: "jsonld", json: JSON.parse(scriptBody ?? "") });
      } catch {
        warnings.push('<script type="application/ld+json">: body is not valid JSON; removed');
      }
      continue;
    }
    if (simpleTag !== undefined) {
      const kind = simpleTag.toLowerCase() as "meta" | "link";
      const attrs = parseAttributes(simpleAttrs ?? "", warnings, kind);
      if (kind === "link") {
        const rel = (attrs.rel ?? "").toLowerCase();
        if (!rel || !attrs.href) {
          warnings.push("<link>: needs both rel and href; removed");
          continue;
        }
        if (rel.split(/\s+/).some((r) => BLOCKED_LINK_RELS.has(r))) {
          warnings.push(`<link rel="${rel}">: this rel is not allowed in the custom head; removed`);
          continue;
        }
      }
      if (
        kind === "meta" &&
        !attrs.name &&
        !attrs.property &&
        !attrs["http-equiv"] &&
        !attrs.charset
      ) {
        warnings.push("<meta>: needs name, property or http-equiv; removed");
        continue;
      }
      if (kind === "meta" && attrs["http-equiv"]) {
        warnings.push(
          `<meta http-equiv="${attrs["http-equiv"]}">: http-equiv is not allowed; removed`,
        );
        continue;
      }
      tags.push({ kind, attrs });
      continue;
    }
    if (otherTag !== undefined) {
      warnings.push(`<${otherTag.toLowerCase()}>: tag not allowed in the custom head; removed`);
      continue;
    }
    if (token.trim()) warnings.push(`removed stray text: "${token.trim().slice(0, 40)}"`);
  }

  return { html: tags.map(serializeTag).join("\n"), warnings, tags };
}
