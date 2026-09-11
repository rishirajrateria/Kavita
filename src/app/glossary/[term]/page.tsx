import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Byline, CtaBand, PageHero, Prose, QuestionSection } from "@/components/content";
import { ArticleGrid, TermChips, definedTermSchema, learnMetadata } from "@/components/learn";
import { JsonLd } from "@/components/seo/json-ld";
import { GLOSSARY } from "@/content/glossary";
import { getArticlesForTerm, getGlossaryTerm, getRelatedTerms } from "@/lib/articles";
import { getSiteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ term: t.slug }));
}

const SCIENCE = { astrology: "Vedic astrology", vastu: "vastu shastra" } as const;

export async function generateMetadata({
  params,
}: PageProps<"/glossary/[term]">): Promise<Metadata> {
  const { term: slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return {};
  const science = SCIENCE[term.category];
  return learnMetadata({
    title: `${term.term} — meaning in ${science}`,
    description: `${term.term} in ${science}, defined by Astrologer Kavita: ${term.short}`,
    path: `/glossary/${term.slug}`,
    siteUrl: getSiteUrl(),
    ogKind: term.category === "vastu" ? "vastu" : "astrologer",
  });
}

/**
 * `/glossary/[term]` — one term: the standalone short definition as the `.answer`, the fuller
 * definition, related terms, and the guides that use it. `DefinedTerm` JSON-LD points at the
 * `DefinedTermSet` on `/glossary`.
 */
export default async function GlossaryTermPage({ params }: PageProps<"/glossary/[term]">) {
  const { term: slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const siteUrl = getSiteUrl();
  const science = SCIENCE[term.category];
  const related = getRelatedTerms(term);
  const articles = getArticlesForTerm(term.slug);
  const heading = term.term.replace(/\s*\(.*\)$/, "");

  return (
    <>
      <JsonLd id="term-schema" data={definedTermSchema(term, siteUrl)} />
      <PageHero
        eyebrow={`Glossary · ${science}`}
        title={term.term}
        lede={`A ${science} term, defined by Astrologer Kavita: one standalone sentence, the fuller meaning, related terms, and the guides in which it is used.`}
        motif={term.category === "vastu" ? "compass" : "north-chart"}
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: "Glossary", href: "/glossary" },
          { name: term.term, href: `/glossary/${term.slug}` },
        ]}
        entity={
          term.sanskrit ? (
            <>
              Sanskrit: <span lang="sa-Latn">{term.sanskrit}</span>
              {term.aliases.length ? ` · Also: ${term.aliases.join(", ")}` : ""}
            </>
          ) : term.aliases.length ? (
            `Also: ${term.aliases.join(", ")}`
          ) : undefined
        }
        className="pb-8 sm:pb-10 lg:pb-12"
      />

      <div className="mx-auto w-full max-w-wide px-gutter">
        <Byline datePublished={term.dateModified} />
      </div>

      <QuestionSection
        id="definition"
        eyebrow="Definition"
        question={`What does ${heading.toLowerCase()} mean in ${science}?`}
        answer={`${term.short} Astrologer Kavita uses the term in this sense when reading a client's birth chart and home together, and defines it fully below.`}
        layout="split"
      >
        <Prose className="text-lg">
          <p>{term.definition}</p>
        </Prose>
        <TermChips terms={related} label="Related terms" />
      </QuestionSection>

      {articles.length > 0 ? (
        <QuestionSection
          id="articles"
          eyebrow="In use"
          question={`Which guides use the term ${heading.toLowerCase()}?`}
          answer={`The guides below from Astrologer Kavita use ${heading.toLowerCase()} in context — in a worked explanation rather than a definition — so the meaning above can be seen doing its work. Each opens with a self-contained answer, defines every term on first use, and links back to this glossary entry where the term appears.`}
          tone="muted"
        >
          <ArticleGrid articles={articles} columns={3} />
        </QuestionSection>
      ) : null}

      <CtaBand
        eyebrow="Next step"
        title="Would you like this read in your own chart and home?"
        body="A consultation with Astrologer Kavita explains every term as it arises in your own kundli and floor plan, online in your local hours, with a written summary afterwards."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref="/glossary"
        secondaryLabel="All glossary terms"
        motif={term.category === "vastu" ? "compass" : "south-chart"}
      />
    </>
  );
}
