import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { notFound } from "next/navigation";
import {
  Byline,
  CtaDisc,
  FigureSection,
  MotifSprite,
  Prose,
  SceneHero,
} from "@/components/content";
import {
  ArticleGrid,
  LearnFigure,
  TermChips,
  definedTermSchema,
  learnMetadata,
} from "@/components/learn";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
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
  return applyPageSeo(
    learnMetadata({
      title: `${term.term} — meaning in ${science}`,
      description: `${term.term} in ${science}, defined by Astrologer Kavita: ${term.short}`,
      path: `/glossary/${term.slug}`,
      siteUrl: getSiteUrl(),
      ogKind: term.category === "vastu" ? "vastu" : "astrologer",
    }),
    `/glossary/${term.slug}`,
  );
}

/**
 * `/glossary/[term]` — one term: its science's instrument as the hero, the standalone short
 * definition as the `.answer`, the fuller definition visible in full, related terms as chip
 * doors, the guides that use it as doors. `DefinedTerm` JSON-LD points at the `DefinedTermSet`
 * on `/glossary`.
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
  const route = `/glossary/${term.slug}`;
  const vastu = term.category === "vastu";

  return (
    <>
      <JsonLd id="term-schema" data={definedTermSchema(term, siteUrl)} />
      <MotifSprite />
      <SceneHero
        title={term.term}
        titleFont="serif"
        tagline={`Glossary · ${science}`}
        lede={`A ${science} term, defined by Astrologer Kavita: one standalone sentence, the fuller meaning, related terms, and the guides in which it is used.`}
        figure={
          <LearnFigure
            motif={vastu ? "compass" : "north-chart"}
            size="small"
            title={vastu ? "The vastu compass rose" : "A North Indian birth chart"}
          />
        }
        figureSize="small"
        figureRatio="1/1"
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: "Glossary", href: "/glossary" },
          { name: term.term, href: route },
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

      <Container size="wide">
        <div className="mx-auto max-w-[40rem]">
          <Byline datePublished={term.dateModified} withoutPhoto />
        </div>
      </Container>

      <FigureSection
        id="definition"
        route={route}
        n="I"
        question={`What does ${heading.toLowerCase()} mean in ${science}?`}
        answer={`${term.short} Astrologer Kavita uses the term in this sense when reading a client's birth chart and home together, and defines it fully below.`}
        className="pt-8 sm:pt-10"
      >
        <Prose className="font-serif text-[1.25rem] leading-[1.7]">
          <p>{term.definition}</p>
        </Prose>
        <TermChips terms={related} label="Related terms" />
      </FigureSection>

      {articles.length > 0 ? (
        <FigureSection
          id="articles"
          route={route}
          n="II"
          tone="muted"
          question={`Which guides use the term ${heading.toLowerCase()}?`}
          answer={`The guides below from Astrologer Kavita use ${heading.toLowerCase()} in context — in a worked explanation rather than a definition — so the meaning above can be seen doing its work. Each opens with a self-contained answer, defines every term on first use, and links back to this glossary entry where the term appears.`}
        >
          <ArticleGrid articles={articles} columns={2} caption="In use" captionAlign="start" />
        </FigureSection>
      ) : null}

      <CtaDisc
        eyebrow="Next step"
        title="Would you like this read in your own chart and home?"
        body="A consultation with Astrologer Kavita explains every term as it arises in your own kundli and floor plan, online in your local hours, with a written summary afterwards."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref="/glossary"
        secondaryLabel="All glossary terms"
        motif={vastu ? "compass" : "south-chart"}
      />
    </>
  );
}
