import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { CtaDisc, FigureSection, MotifSprite, SceneHero } from "@/components/content";
import {
  GhostLink,
  GlossaryList,
  LearnFigure,
  definedTermSetSchema,
  learnMetadata,
} from "@/components/learn";
import { JsonLd } from "@/components/seo/json-ld";
import { getGlossaryTerms } from "@/lib/articles";
import { getSiteUrl } from "@/lib/site";

const TITLE = "Glossary of astrology and vastu terms";
const DESCRIPTION =
  "Twenty-five Vedic astrology and vastu terms — kundli, dasha, lagna, nakshatra, brahmasthan, ishaan and more — each defined plainly by Astrologer Kavita.";

const BASE_METADATA: Metadata = learnMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/glossary",
  siteUrl: getSiteUrl(),
});

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/glossary");
}

/**
 * `/glossary` — every term grouped by science as a ruled field of doors, the short definitions
 * visible in the HTML, each field the picture of its plate with the count ruled beneath and the
 * question and answer under that; the South Indian chart opens the page, the disc closes it.
 */
export default function GlossaryPage() {
  const siteUrl = getSiteUrl();
  const all = getGlossaryTerms();
  const astrology = all.filter((t) => t.category === "astrology");
  const vastu = all.filter((t) => t.category === "vastu");

  return (
    <>
      <JsonLd id="glossary-schema" data={definedTermSetSchema(all, siteUrl)} />
      <MotifSprite />
      <SceneHero
        title={TITLE}
        tagline="Learn · Glossary"
        lede="The words a reading uses, defined in one plain sentence and one fuller paragraph each. Where traditions differ, the entry says so; no entry promises an outcome."
        figure={
          <LearnFigure
            motif="south-chart"
            title="A South Indian birth chart"
            description="The square South Indian chart layout, in which the twelve signs keep fixed places and the ascendant is marked."
          />
        }
        figureSize="half"
        figureRatio="1/1"
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: "Glossary", href: "/glossary" },
        ]}
        actions={
          <>
            <GhostLink href="#astrology">Astrology terms</GhostLink>
            <GhostLink href="#vastu">Vastu terms</GhostLink>
          </>
        }
      />

      <FigureSection
        route="/glossary"
        id="astrology"
        n="I"
        question="What do the Vedic astrology terms in a reading mean?"
        answer="The Vedic astrology terms below — kundli, lagna, rashi, nakshatra, dasha, navamsa and the rest — are the vocabulary Astrologer Kavita uses when reading a birth chart. Each is defined here in one standalone sentence; the term's own page carries the fuller definition, related terms and the guides that use it."
        figure={<GlossaryList terms={astrology} />}
        figureWidth="wide"
        line={`${astrology.length} terms`}
      />

      <FigureSection
        route="/glossary"
        id="vastu"
        n="II"
        tone="muted"
        question="What do the vastu shastra terms in a reading mean?"
        answer="The vastu shastra terms below — the vastu purusha mandala, the brahmasthan, and the four corner directions ishaan, agneya, nairutya and vayavya — are the vocabulary Astrologer Kavita uses when reading a home or workplace. Each is defined in one standalone sentence, with the fuller definition on the term's own page."
        figure={<GlossaryList terms={vastu} />}
        figureWidth="default"
        line={`${vastu.length} terms`}
      />

      <CtaDisc
        eyebrow="Beyond definitions"
        title="Would you like these terms applied to your own chart and home?"
        body="A consultation with Astrologer Kavita reads your kundli and your floor plan together, explains every term as it comes up, and leaves you with a written summary you can read against this glossary."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref="/learn"
        secondaryLabel="Read the guides"
      />
    </>
  );
}
