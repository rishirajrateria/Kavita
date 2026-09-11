import {
  extractCanonical,
  extractMain,
  extractTitle,
  htmlToMarkdown,
  pageToMarkdown,
  renderMarkdownDocument,
} from "@/lib/markdown/html-to-markdown";
import { equal, excludes, includes } from "./_assert";

const HTML = `<!doctype html><html><head><title>About — Astrologer Kavita</title>
<meta name="description" content="Who Kavita is &amp; what she does">
<link rel="canonical" href="https://example.com/about"></head>
<body><header><nav><a href="/">Home</a></nav></header>
<main><h1>About Kavita</h1><p class="answer">Astrologer Kavita reads charts.</p>
<svg><path d="M0 0"/></svg><span aria-hidden="true">decoration</span>
<script>alert(1)</script><style>.x{}</style>
<h2>How much?</h2><table><thead><tr><th>Service</th><th>Length</th></tr></thead>
<tbody><tr><td>Kundli | reading</td><td>60 min</td></tr></tbody></table>
<dl><dt>Timezone</dt><dd>Asia/Kolkata</dd></dl>
<details><summary>Is vastu for flats?</summary><p>Yes, it applies.</p></details>
</main><footer>© footer</footer></body></html>`;

export function run(): void {
  equal(extractTitle(HTML), "About", "title without site suffix");
  equal(extractCanonical(HTML), "https://example.com/about", "canonical");
  includes(extractMain(HTML), "<h1>About Kavita</h1>", "main extracted");
  excludes(extractMain(HTML), "footer", "main excludes footer");

  const md = htmlToMarkdown(extractMain(HTML));
  includes(md, "# About Kavita", "atx h1");
  includes(md, "## How much?", "atx h2");
  excludes(md, "decoration", "aria-hidden stripped");
  excludes(md, "alert(1)", "script stripped");
  excludes(md, ".x{}", "style stripped");
  excludes(md, "M0 0", "svg stripped");
  includes(md, "| Service | Length |", "table header");
  includes(md, "| --- | --- |", "table rule");
  includes(md, "| Kundli \\| reading | 60 min |", "table cell with escaped pipe");
  includes(md, "**Timezone**", "dt bold");
  includes(md, "Asia/Kolkata", "dd text");
  includes(md, "**Is vastu for flats?**", "summary bold");
  includes(md, "Yes, it applies.", "details body");

  const page = pageToMarkdown(HTML);
  equal(page.description, "Who Kavita is & what she does", "description decoded");
  const doc = renderMarkdownDocument(page, "https://example.com/about");
  includes(doc, '---\ntitle: "About"\n', "front matter title");
  includes(doc, "canonical: https://example.com/about\n", "front matter canonical");
  includes(doc, "source: https://example.com/about\n---\n", "front matter source");
  excludes(doc, "footer", "no chrome in document");
}
