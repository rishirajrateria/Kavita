import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { CtaBand, PageHero, QuestionSection } from "@/components/content";
import { ArticleGrid, CategoryCard, GlossaryList, learnMetadata } from "@/components/learn";
import { Button } from "@/components/ui/button";
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

/** `/learn` — the library hub: categories with counts, latest articles, glossary teaser. */
export default function LearnPage() {
  const categories = getArticleCategories();
  const latest = getArticles().slice(0, 6);
  const terms = getGlossaryTerms().filter((t) => FEATURED_TERMS.includes(t.slug));

  return (
    <>
      <PageHero
        eyebrow="Learn · guides, articles and glossary"
        title={TITLE}
        lede="Answers to the questions people actually ask about a birth chart and a home — written plainly, with every Sanskrit term defined the first time it appears, by the practitioner who reads both together."
        motif="lines"
        breadcrumbs={[{ name: "Learn", href: "/learn" }]}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <Link href="#categories">Browse the guides</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href="/glossary">
                Glossary of terms
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </Button>
          </>
        }
      />

      <QuestionSection
        id="categories"
        eyebrow="Four sections"
        question="What will you find in the Learn library?"
        answer="The Learn library from Astrologer Kavita holds four sections: astrology basics, vastu basics, how astrology and vastu work together, and how to prepare for a consultation. Each article answers one real question — is vastu applicable to apartments, do I need my exact birth time — in plain English, with every term defined."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </QuestionSection>

      <QuestionSection
        id="latest"
        eyebrow="Latest"
        question="Which guides are newest?"
        answer="The newest guides from Astrologer Kavita are listed below with the date each was last revised and its reading time. Every article is written for a first-time reader, opens each section with a self-contained answer, closes with the questions people most often ask, and links the terms it uses to the glossary."
        tone="muted"
      >
        <ArticleGrid articles={latest} />
      </QuestionSection>

      <QuestionSection
        id="glossary"
        eyebrow="Glossary"
        question="What do the terms in a reading actually mean?"
        answer="The glossary from Astrologer Kavita defines the terms a reading uses — kundli, dasha, lagna, nakshatra, brahmasthan, ishaan and others — in one short standalone sentence and one fuller definition each, noting where traditions differ and never promising an outcome. A few of the most-used terms are defined below; the full list has twenty-five."
      >
        <GlossaryList terms={terms} />
        <Button asChild variant="link" className="px-0">
          <Link href="/glossary">See all glossary terms →</Link>
        </Button>
      </QuestionSection>

      <CtaBand
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
