/**
 * Every article: front-matter validates (the loader throws otherwise), ≥ 1,200 words of body,
 * every H2 is a question followed immediately by an `<Answer>` of 40–60 words, descriptions
 * fit 150–160 characters, `<Term>` slugs exist, related slugs resolve, slugs are unique, and
 * the TOC ids match what `rehype-slug` assigns when the body is actually compiled.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ARTICLE_CATEGORIES } from "@/content/article-categories";
import {
  ARTICLES_DIR,
  articleFrontmatterSchema,
  getArticleBySlug,
  getArticleCategories,
  getArticles,
  getGlossaryTerm,
  getRelatedArticles,
} from "@/lib/articles";
import { MDX_COMPONENTS } from "@/lib/mdx/components";
import { AUTOLINK_OPTIONS } from "@/lib/mdx/options";
import { extractToc, slugify } from "@/lib/mdx/slug";
import { check, equal } from "./_assert.mjs";

const MIN_WORDS = 1200;
const ANSWER_MIN = 40;
const ANSWER_MAX = 60;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

interface Section {
  heading: string;
  answer: string | null;
}

/** H2 → the `<Answer>` block that must follow it (nothing but blank lines between). */
function sections(body: string): Section[] {
  const lines = body.split(/\r?\n/);
  const out: Section[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.startsWith("## ")) continue;
    let j = i + 1;
    while (j < lines.length && (lines[j] ?? "").trim() === "") j += 1;
    const opener = (lines[j] ?? "").trim();
    if (opener === "<Answer>") {
      const parts: string[] = [];
      j += 1;
      while (j < lines.length && (lines[j] ?? "").trim() !== "</Answer>") {
        parts.push(lines[j] ?? "");
        j += 1;
      }
      out.push({ heading: line.slice(3).trim(), answer: parts.join(" ") });
    } else if (/^<Answer>.*<\/Answer>$/.test(opener)) {
      out.push({ heading: line.slice(3).trim(), answer: opener.replace(/<\/?Answer>/g, "") });
    } else {
      out.push({ heading: line.slice(3).trim(), answer: null });
    }
  }
  return out;
}

export async function run(): Promise<void> {
  const articles = getArticles();
  check(articles.length >= 8, `at least 8 articles (found ${articles.length})`);

  // Every .mdx on disk is loaded (a file in an unknown folder would be silently skipped).
  let onDisk = 0;
  for (const c of ARTICLE_CATEGORIES) {
    const dir = join(ARTICLES_DIR, c.slug);
    if (existsSync(dir)) onDisk += readdirSync(dir).filter((f) => f.endsWith(".mdx")).length;
  }
  equal(articles.length, onDisk, "every article file in a known category loads");
  const strayDirs = readdirSync(ARTICLES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((d) => !ARTICLE_CATEGORIES.some((c) => c.slug === d));
  equal(strayDirs.length, 0, `article folders match categories (stray: ${strayDirs.join(", ")})`);

  const slugs = articles.map((a) => a.slug);
  equal(new Set(slugs).size, slugs.length, "article slugs unique");

  for (const a of articles) {
    const label = `${a.category}/${a.slug}`;
    check(articleFrontmatterSchema.safeParse(a).success, `${label}: front-matter validates`);
    check(a.wordCount >= MIN_WORDS, `${label}: ${a.wordCount} words (min ${MIN_WORDS})`);
    check(a.title.length <= 70, `${label}: title ≤ 70 chars (${a.title.length})`);
    check(
      a.description.length >= 150 && a.description.length <= 160,
      `${label}: description 150–160 chars (${a.description.length})`,
    );
    check(a.faq.length >= 3 && a.faq.length <= 5, `${label}: 3–5 FAQs (${a.faq.length})`);
    check(a.readingMinutes >= 4, `${label}: reading time computed (${a.readingMinutes})`);
    check(a.dateModified >= a.datePublished, `${label}: dateModified ≥ datePublished`);
    check(!/\{\{[^}]*\}\}/.test(a.body), `${label}: no {{PLACEHOLDER}} in body`);
    check(!/\bguaranteed\b|100% accurate/i.test(a.body), `${label}: no guarantees promised`);
    check(/<Term\s+slug=/.test(a.body), `${label}: links at least one glossary term`);
    check(/^\|.*\|\s*$/m.test(a.body), `${label}: contains a table`);

    const secs = sections(a.body);
    check(secs.length >= 4, `${label}: at least 4 H2 sections (${secs.length})`);
    const named = secs.filter((s) => s.answer?.includes("Astrologer Kavita")).length;
    check(
      named * 2 >= secs.length,
      `${label}: at least half the answers name Astrologer Kavita (${named}/${secs.length})`,
    );
    for (const s of secs) {
      check(s.heading.endsWith("?"), `${label}: H2 is a question: "${s.heading}"`);
      if (s.answer === null) {
        check(false, `${label}: H2 "${s.heading}" not followed by <Answer>`);
        continue;
      }
      const n = words(s.answer.replace(/<[^>]+>/g, ""));
      check(
        n >= ANSWER_MIN && n <= ANSWER_MAX,
        `${label}: answer under "${s.heading}" is ${n} words (want ${ANSWER_MIN}–${ANSWER_MAX})`,
      );
    }
    equal(
      a.toc.length,
      secs.length + (a.body.match(/^### /gm)?.length ?? 0),
      `${label}: TOC covers every H2/H3`,
    );
    check(new Set(a.toc.map((t) => t.id)).size === a.toc.length, `${label}: TOC ids unique`);

    for (const term of a.terms) {
      check(
        getGlossaryTerm(term) !== undefined,
        `${label}: <Term slug="${term}"> exists in glossary`,
      );
    }
    for (const rel of a.relatedSlugs) {
      check(getArticleBySlug(rel) !== undefined, `${label}: relatedSlugs "${rel}" resolves`);
      check(rel !== a.slug, `${label}: does not relate to itself`);
    }
    check(getRelatedArticles(a).length >= 1, `${label}: has related reading`);
    check(!getRelatedArticles(a).some((r) => r.slug === a.slug), `${label}: related excludes self`);
  }

  // Categories: each has a question H2 with a 40–60 word answer naming the practice.
  for (const c of getArticleCategories()) {
    check(c.question.endsWith("?"), `${c.slug}: hub question is a question`);
    const n = words(c.answer);
    check(n >= ANSWER_MIN && n <= ANSWER_MAX, `${c.slug}: hub answer ${n} words`);
    check(c.answer.includes("Astrologer Kavita"), `${c.slug}: hub answer names Astrologer Kavita`);
    check(c.count >= 1, `${c.slug}: category has at least one article`);
  }

  // Slugger agrees with github-slugger on the cases the headings use.
  equal(
    slugify("Do I need my exact birth time?"),
    "do-i-need-my-exact-birth-time",
    "slug: punctuation",
  );
  equal(slugify("What is a dasha — and why?"), "what-is-a-dasha--and-why", "slug: em dash");
  equal(slugify("Bangalore's climate"), "bangalores-climate", "slug: apostrophe");
  equal(slugify("D-9 / navamsa (ninth) chart"), "d-9--navamsa-ninth-chart", "slug: symbols");
  const dup = extractToc("## Same\n\n## Same\n\n### Same");
  equal(dup.map((t) => t.id).join(","), "same,same-1,same-2", "slug: duplicates numbered");

  // The predicted ids equal the ids rehype-slug assigns when the body is compiled through the
  // real pipeline, and every `<Answer>` renders as a single `<p class="answer">` (never nested).
  // (Imported dynamically from this ESM test so the ESM-only MDX toolchain resolves; the page
  // renderer in `src/lib/mdx/render.tsx` uses exactly this configuration.)
  const [{ compileMDX }, remarkGfm, rehypeSlug, rehypeAutolinkHeadings, { renderToStaticMarkup }] =
    await Promise.all([
      import("next-mdx-remote/rsc"),
      import("remark-gfm").then((m) => m.default),
      import("rehype-slug").then((m) => m.default),
      import("rehype-autolink-headings").then((m) => m.default),
      import("react-dom/server"),
    ]);
  for (const a of articles) {
    const { content } = await compileMDX({
      source: a.body,
      components: MDX_COMPONENTS,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { ...AUTOLINK_OPTIONS }]],
        },
      },
    });
    const html = renderToStaticMarkup(content);
    for (const item of a.toc) {
      check(html.includes(`id="${item.id}"`), `${a.slug}: rehype-slug assigns "${item.id}"`);
    }
    const answers = html.match(/<p class="answer">/g)?.length ?? 0;
    equal(answers, sections(a.body).length, `${a.slug}: one .answer per H2 in rendered HTML`);
    check(!/<p[^>]*>\s*<p/.test(html), `${a.slug}: no nested paragraphs`);
    check(html.includes('href="/glossary/'), `${a.slug}: Term renders a glossary link`);
    check(html.includes("<table"), `${a.slug}: table renders`);
  }
}
