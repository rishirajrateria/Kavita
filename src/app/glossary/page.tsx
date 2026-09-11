import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHero, QuestionSection } from "@/components/content";
import { GlossaryList, definedTermSetSchema, learnMetadata } from "@/components/learn";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getGlossaryTerms } from "@/lib/articles";
import { getSiteUrl } from "@/lib/site";

const TITLE = "Glossary of astrology and vastu terms";
const DESCRIPTION =
  "Twenty-five Vedic astrology and vastu terms — kundli, dasha, lagna, nakshatra, brahmasthan, ishaan and more — each defined plainly by Astrologer Kavita.";

export const metadata: Metadata = learnMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/glossary",
  siteUrl: getSiteUrl(),
});

/** `/glossary` — every term grouped by science, with the short definitions in the HTML. */
export default function GlossaryPage() {
  const siteUrl = getSiteUrl();
  const all = getGlossaryTerms();
  const astrology = all.filter((t) => t.category === "astrology");
  const vastu = all.filter((t) => t.category === "vastu");

  return (
    <>
      <JsonLd id="glossary-schema" data={definedTermSetSchema(all, siteUrl)} />
      <PageHero
        eyebrow="Learn · Glossary"
        title={TITLE}
        lede="The words a reading uses, defined in one plain sentence and one fuller paragraph each. Where traditions differ, the entry says so; no entry promises an outcome."
        motif="south-chart"
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: "Glossary", href: "/glossary" },
        ]}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <Link href="#astrology">Astrology terms</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href="#vastu">
                Vastu terms
                <span aria-hidden="true" data-arrow className="inline-block">
                  →
                </span>
              </Link>
            </Button>
          </>
        }
      />

      <QuestionSection
        id="astrology"
        eyebrow={`${astrology.length} terms`}
        question="What do the Vedic astrology terms in a reading mean?"
        answer="The Vedic astrology terms below — kundli, lagna, rashi, nakshatra, dasha, navamsa and the rest — are the vocabulary Astrologer Kavita uses when reading a birth chart. Each is defined here in one standalone sentence; the term's own page carries the fuller definition, related terms and the guides that use it."
      >
        <GlossaryList terms={astrology} />
      </QuestionSection>

      <QuestionSection
        id="vastu"
        eyebrow={`${vastu.length} terms`}
        question="What do the vastu shastra terms in a reading mean?"
        answer="The vastu shastra terms below — the vastu purusha mandala, the brahmasthan, and the four corner directions ishaan, agneya, nairutya and vayavya — are the vocabulary Astrologer Kavita uses when reading a home or workplace. Each is defined in one standalone sentence, with the fuller definition on the term's own page."
        tone="muted"
      >
        <GlossaryList terms={vastu} />
      </QuestionSection>

      <CtaBand
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
