/**
 * JSON-LD for the Learn library (CLAUDE.md §8): `Article` with the practitioner as author,
 * `DefinedTerm` / `DefinedTermSet` for the glossary. Built from the article and glossary
 * records only — nothing hardcoded, nothing invented. Person and organisation are referenced
 * by the site-wide `@id`s so consumers merge them with the home page's full nodes.
 */
import type { GlossaryTerm } from "@/content/glossary";
import type { Article } from "@/lib/articles";
import { compact, schemaId, withContext, type Thing, type WithContext } from "@/lib/seo/schema";

export const GLOSSARY_SET_ID = "/glossary#definedtermset";

export function definedTermId(siteUrl: string, slug: string): string {
  return `${siteUrl}/glossary/${slug}#term`;
}

export function definedTermSchema(term: GlossaryTerm, siteUrl: string): WithContext<Thing> {
  return withContext(
    compact({
      "@type": "DefinedTerm",
      "@id": definedTermId(siteUrl, term.slug),
      name: term.term,
      alternateName: term.sanskrit,
      description: term.short,
      url: `${siteUrl}/glossary/${term.slug}`,
      termCode: term.slug,
      inDefinedTermSet: { "@type": "DefinedTermSet", "@id": `${siteUrl}${GLOSSARY_SET_ID}` },
    }),
  );
}

export function definedTermSetSchema(terms: GlossaryTerm[], siteUrl: string): WithContext<Thing> {
  return withContext({
    "@type": "DefinedTermSet",
    "@id": `${siteUrl}${GLOSSARY_SET_ID}`,
    name: "Astrologer Kavita glossary of Vedic astrology and vastu terms",
    url: `${siteUrl}/glossary`,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      "@id": definedTermId(siteUrl, t.slug),
      name: t.term,
      description: t.short,
      url: `${siteUrl}/glossary/${t.slug}`,
    })),
  });
}

export interface ArticleSchemaInput {
  article: Article;
  siteUrl: string;
  /** Real practitioner name (never a placeholder); the brand name when not yet supplied. */
  authorName: string;
  /** Glossary terms the article links, for `about`. */
  terms: GlossaryTerm[];
  imageUrl?: string;
}

export function articleSchema(input: ArticleSchemaInput): WithContext<Thing> {
  const { article, siteUrl, terms } = input;
  const url = `${siteUrl}${article.href}`;
  return withContext(
    compact({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: article.title,
      description: article.description,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      inLanguage: "en",
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      wordCount: article.wordCount,
      keywords: article.keywords.join(", "),
      articleSection: article.categoryInfo.name,
      image: input.imageUrl,
      author: {
        "@type": "Person",
        "@id": schemaId(siteUrl, "person"),
        name: input.authorName,
        url: `${siteUrl}/about`,
      },
      publisher: { "@type": "ProfessionalService", "@id": schemaId(siteUrl, "organization") },
      about: terms.length
        ? terms.map((t) => ({
            "@type": "DefinedTerm",
            "@id": definedTermId(siteUrl, t.slug),
            name: t.term,
          }))
        : undefined,
      isPartOf: { "@type": "WebSite", "@id": schemaId(siteUrl, "website") },
    }),
  );
}
