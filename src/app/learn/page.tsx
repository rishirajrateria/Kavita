import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { CtaDisc, FigureSection, MotifSprite, SceneHero } from "@/components/content";
import {
  ArticleGrid,
  CategoryDoors,
  GhostLink,
  GlossaryList,
  LearnFigure,
  learnMetadata,
} from "@/components/learn";
import { getArticleCategories, getArticles, getGlossaryTerms } from "@/lib/articles";
import { getSiteUrl } from "@/lib/site";

const TITLE = "Learn Vedic astrology and vastu";
const DESCRIPTION =
  "Plain-English guides to Vedic astrology and vastu shastra from Astrologer Kavita: how a kundli is read, how vastu applies to flats, and how the two work together.";

const BASE_METADATA: Metadata = learnMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn",
  siteUrl: getSiteUrl(),
});

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/learn");
}

const FEATURED_TERMS = ["kundli", "dasha", "lagna", "brahmasthan", "ishaan", "muhurat"];

/**
 * `/learn` — the library as doors. The astronomical lines open the page; then three plates,
 * each a field of real links first — the four sections, the six newest guides, six of the
 * glossary's terms — with one ruled line under it and the question and its visible answer
 * beneath; the parchment disc closes it. Server-rendered HTML throughout — every description,
 * definition and link is served without JavaScript.
 */
export default function LearnPage() {
  const categories = getArticleCategories();
  const latest = getArticles().slice(0, 6);
  const terms = getGlossaryTerms().filter((t) => FEATURED_TERMS.includes(t.slug));

  return (
    <>
      <MotifSprite />
      <SceneHero
        title={TITLE}
        tagline="Learn · guides, articles and glossary"
        lede="Answers to the questions people actually ask about a birth chart and a home — written plainly, with every Sanskrit term defined the first time it appears, by the practitioner who reads both together."
        figure={
          <LearnFigure
            motif="lines"
            title="Astronomical orbital linework"
            description="Thin orbital arcs, ecliptic ticks and a few small bodies drawn in gold hairlines."
          />
        }
        figureSize="wide"
        figureRatio="16/9"
        breadcrumbs={[{ name: "Learn", href: "/learn" }]}
        actions={
          <>
            <GhostLink href="#categories">Browse the guides</GhostLink>
            <GhostLink href="/glossary">Glossary of terms</GhostLink>
          </>
        }
      />

      <FigureSection
        route="/learn"
        id="categories"
        n="I"
        question="What will you find in the Learn library?"
        answer="The Learn library from Astrologer Kavita holds four sections: astrology basics, vastu basics, how astrology and vastu work together, and how to prepare for a consultation. Each article answers one real question — is vastu applicable to apartments, do I need my exact birth time — in plain English, with every term defined."
        figure={<CategoryDoors categories={categories} />}
        figureWidth="wide"
        line="Four sections"
      />

      <FigureSection
        route="/learn"
        id="latest"
        n="II"
        tone="muted"
        question="Which guides are newest?"
        answer="The newest guides from Astrologer Kavita are listed below with the date each was last revised and its reading time. Every article is written for a first-time reader, opens each section with a self-contained answer, closes with the questions people most often ask, and links the terms it uses to the glossary."
        figure={<ArticleGrid articles={latest} columns={3} />}
        figureWidth="default"
        line="Latest"
      />

      <FigureSection
        route="/learn"
        id="glossary"
        n="III"
        question="What do the terms in a reading actually mean?"
        answer="The glossary from Astrologer Kavita defines the terms a reading uses — kundli, dasha, lagna, nakshatra, brahmasthan, ishaan and others — in one short standalone sentence and one fuller definition each, noting where traditions differ and never promising an outcome. A few of the most-used terms are defined below; the full list has twenty-five."
        figure={<GlossaryList terms={terms} />}
        figureWidth="wide"
        line="Glossary"
      >
        <p className="text-center">
          <GhostLink href="/glossary">See all glossary terms</GhostLink>
        </p>
      </FigureSection>

      <CtaDisc
        eyebrow="Beyond reading"
        title="Ready to have your chart and your home read together?"
        body="Reading is a good start; a consultation applies it to your own kundli and your own floor plan. Astrologer Kavita reads both in one session, online in your local hours, and sends a written summary afterwards."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref="/services"
        secondaryLabel="See the services"
      />
    </>
  );
}
