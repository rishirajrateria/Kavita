/**
 * Learn content loader (CLAUDE.md §5 `/learn`, §9.10). Reads `src/content/articles/<category>/
 * <slug>.mdx` from disk at build time — file system only, never a client bundle — validates the
 * front-matter with zod, and derives reading time, word count, the table of contents and the
 * glossary terms each article uses. Glossary entries come from `src/content/glossary.ts`.
 *
 * Everything is synchronous so the sitemap generator and the tests can call it without a
 * runtime; results are memoised per process in production (the content is immutable once
 * built) and re-read in development so edits show without a restart.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";
import {
  ARTICLE_CATEGORIES,
  getArticleCategory,
  type ArticleCategory,
} from "@/content/article-categories";
import { GLOSSARY, type GlossaryCategory, type GlossaryTerm } from "@/content/glossary";
import { extractToc, type TocItem } from "@/lib/mdx/slug";

export const ARTICLES_DIR = join(process.cwd(), "src", "content", "articles");

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const articleFaqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(40),
});

/** Front-matter contract every article must satisfy (see the Phase 3 contract). */
export const articleFrontmatterSchema = z.object({
  title: z.string().min(10).max(120),
  description: z.string().min(80).max(200),
  category: z.enum(ARTICLE_CATEGORIES.map((c) => c.slug) as [string, ...string[]]),
  datePublished: z.string().regex(DATE, "YYYY-MM-DD"),
  dateModified: z.string().regex(DATE, "YYYY-MM-DD"),
  keywords: z.array(z.string().min(2)).min(1).max(12),
  relatedSlugs: z.array(z.string().regex(SLUG)).max(8).default([]),
  faq: z.array(articleFaqSchema).min(1).max(8),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
export type ArticleFaq = z.infer<typeof articleFaqSchema>;

export interface Article extends ArticleFrontmatter {
  slug: string;
  /** `/learn/<category>/<slug>` */
  href: string;
  categoryInfo: ArticleCategory;
  /** MDX body without front-matter. */
  body: string;
  wordCount: number;
  readingMinutes: number;
  toc: TocItem[];
  /** Glossary slugs referenced with `<Term slug="…">` in the body, in order of first use. */
  terms: string[];
  /** Absolute path of the source file (for error messages and tooling). */
  file: string;
}

export interface ArticleCategoryWithCount extends ArticleCategory {
  count: number;
  href: string;
}

// --- reading ------------------------------------------------------------------------------------

const TERM_RE = /<Term\s+slug=["']([a-z0-9-]+)["']/g;

/** Words of an MDX body as a reader sees them: JSX tags, table rules and markdown syntax removed. */
export function bodyWordCount(body: string): number {
  const text = body
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, " ")
    .replace(/[|#*_`>\[\]()]/g, " ");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function readArticleFile(category: ArticleCategory, file: string): Article {
  const path = join(ARTICLES_DIR, category.slug, file);
  const slug = file.replace(/\.mdx$/, "");
  if (!SLUG.test(slug)) throw new Error(`Article file name is not a slug: ${path}`);
  const parsed = matter(readFileSync(path, "utf8"));
  const result = articleFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid front-matter in ${path}: ${issues}`);
  }
  const fm = result.data;
  if (fm.category !== category.slug) {
    throw new Error(`${path}: front-matter category "${fm.category}" must match its folder`);
  }
  const body = parsed.content.trim();
  const terms: string[] = [];
  for (const match of body.matchAll(TERM_RE)) {
    const term = match[1];
    if (term && !terms.includes(term)) terms.push(term);
  }
  const wordCount = bodyWordCount(body);
  return {
    ...fm,
    slug,
    href: `/learn/${category.slug}/${slug}`,
    categoryInfo: category,
    body,
    wordCount,
    readingMinutes: Math.max(1, Math.round(readingTime(body).minutes)),
    toc: extractToc(body),
    terms,
    file: path,
  };
}

function loadAll(): Article[] {
  const out: Article[] = [];
  for (const category of ARTICLE_CATEGORIES) {
    const dir = join(ARTICLES_DIR, category.slug);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .sort()) {
      out.push(readArticleFile(category, file));
    }
  }
  const seen = new Set<string>();
  for (const a of out) {
    if (seen.has(a.slug)) throw new Error(`Duplicate article slug across categories: ${a.slug}`);
    seen.add(a.slug);
  }
  // Newest first, then title, so hubs and sitemaps are stable.
  return out.sort(
    (a, b) => b.datePublished.localeCompare(a.datePublished) || a.title.localeCompare(b.title),
  );
}

let memo: Article[] | undefined;

function all(): Article[] {
  if (process.env.NODE_ENV === "production") return (memo ??= loadAll());
  return loadAll();
}

// --- public API ---------------------------------------------------------------------------------

/** Every published article, newest first. `category` narrows to one hub. */
export function getArticles(category?: string): Article[] {
  const list = all();
  return category ? list.filter((a) => a.category === category) : list;
}

export function getArticle(category: string, slug: string): Article | undefined {
  return all().find((a) => a.category === category && a.slug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return all().find((a) => a.slug === slug);
}

/** Categories in site-map order with the number of articles each currently holds. */
export function getArticleCategories(): ArticleCategoryWithCount[] {
  const list = all();
  return ARTICLE_CATEGORIES.map((c) => ({
    ...c,
    count: list.filter((a) => a.category === c.slug).length,
    href: `/learn/${c.slug}`,
  }));
}

/**
 * Related reading: the article's own `relatedSlugs` first (in the order written), then the
 * newest others from the same category, up to `limit`. Never the article itself.
 */
export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const list = all();
  const out: Article[] = [];
  for (const slug of article.relatedSlugs) {
    const found = list.find((a) => a.slug === slug && a.slug !== article.slug);
    if (found && !out.includes(found)) out.push(found);
  }
  for (const a of list) {
    if (out.length >= limit) break;
    if (a.slug !== article.slug && a.category === article.category && !out.includes(a)) out.push(a);
  }
  return out.slice(0, limit);
}

/** FAQs of every article in a category, for the hub's FAQ block, capped to keep the page honest. */
export function getCategoryFaqs(category: string, limit = 8): ArticleFaq[] {
  const out: ArticleFaq[] = [];
  for (const a of getArticles(category)) {
    for (const faq of a.faq) {
      if (out.length >= limit) return out;
      if (!out.some((f) => f.question === faq.question)) out.push(faq);
    }
  }
  return out;
}

// --- glossary -----------------------------------------------------------------------------------

/** All glossary terms, alphabetical by display term. */
export function getGlossaryTerms(category?: GlossaryCategory): GlossaryTerm[] {
  const list = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, "en"));
  return category ? list.filter((t) => t.category === category) : list;
}

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

/** Articles that link the term with `<Term>` or list it among their keywords. */
export function getArticlesForTerm(slug: string): Article[] {
  const term = getGlossaryTerm(slug);
  if (!term) return [];
  const names = [term.slug, term.term.toLowerCase(), ...term.aliases.map((a) => a.toLowerCase())];
  return all().filter(
    (a) => a.terms.includes(slug) || a.keywords.some((k) => names.includes(k.toLowerCase())),
  );
}

/** Related glossary entries that exist (a typo in `relatedTerms` is dropped, never a 404). */
export function getRelatedTerms(term: GlossaryTerm): GlossaryTerm[] {
  return term.relatedTerms
    .map((slug) => getGlossaryTerm(slug))
    .filter((t): t is GlossaryTerm => t !== undefined && t.slug !== term.slug);
}

/** Latest `dateModified` among the glossary, for the index page and sitemap. */
export function glossaryLastModified(): string {
  return GLOSSARY.reduce((latest, t) => (t.dateModified > latest ? t.dateModified : latest), "");
}

/** Latest `dateModified` among a set of articles (the whole library by default). */
export function articlesLastModified(articles: Article[] = all()): string | undefined {
  return articles.reduce<string | undefined>(
    (latest, a) => (!latest || a.dateModified > latest ? a.dateModified : latest),
    undefined,
  );
}

export { getArticleCategory };
