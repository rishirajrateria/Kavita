import { formatDisplayDate } from "@/components/content/byline";
import { CtaBand } from "@/components/content/cta-band";
import { PageHero } from "@/components/content/page-hero";
import { Toc, type TocItem } from "@/components/content/toc";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Prose } from "@/components/ui/prose";
import { Section } from "@/components/ui/section";
import type { LegalDocument } from "@/content/legal";
import { cn } from "@/lib/utils";
import { LegalBlockView } from "./legal-blocks";
import { getLegalContext } from "./context";

/**
 * Shared layout of `/privacy`, `/terms` and `/disclaimer`: hero with breadcrumbs, an issued-by
 * / last-updated line, a sticky "On this page" list, and every section as an editorial split
 * — numbered question H2 on the left, `.answer` and body on the right, hairline rules between.
 * Server component; JSON-LD is the BreadcrumbList only (no FAQ/Article markup on legal text).
 */
export async function LegalPage({ doc }: { doc: LegalDocument }) {
  const ctx = await getLegalContext();
  const toc: TocItem[] = doc.sections.map((s) => ({
    id: s.id,
    text: s.tocLabel ?? s.heading,
    level: 2,
  }));
  const modified = doc.dateModified !== doc.datePublished ? doc.dateModified : undefined;

  return (
    <>
      <PageHero
        eyebrow={`${doc.eyebrow} · ${ctx.brandName}`}
        title={doc.title}
        lede={doc.lede}
        motif="lines"
        breadcrumbs={[{ name: doc.title, href: `/${doc.slug}` }]}
        entity={
          <>
            Issued by {ctx.legalEntity}, trading as {ctx.brandName}. Published{" "}
            <time dateTime={doc.datePublished} className="text-foreground">
              {formatDisplayDate(doc.datePublished)}
            </time>
            {modified ? (
              <>
                {" · "}Last updated{" "}
                <time dateTime={modified} className="text-foreground">
                  {formatDisplayDate(modified)}
                </time>
              </>
            ) : null}
            {" · "}Version {doc.version}.
          </>
        }
      />

      <Toc items={toc} />

      <Section spacing="none" className="pt-4 pb-12 sm:pb-16">
        <Container size="wide">
          <div className="divide-y divide-accent-border/40">
            {doc.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-32 py-12 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16"
              >
                <div className="reveal mb-6 lg:mb-0">
                  <Heading
                    as="h2"
                    level={2}
                    id={`${section.id}-heading`}
                    eyebrow={`Section ${String(index + 1).padStart(2, "0")}`}
                    className="max-w-[22ch] lg:sticky lg:top-32"
                  >
                    {section.heading}
                  </Heading>
                </div>
                <Prose unbounded className={cn("max-w-[42rem]")}>
                  {section.answer ? <p className="answer">{section.answer}</p> : null}
                  {section.blocks.map((block, i) => (
                    <LegalBlockView key={`${section.id}-${i}`} block={block} />
                  ))}
                </Prose>
              </section>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Questions"
        title="Anything here you would like explained?"
        body={`${ctx.brandName} answers questions about how a consultation works, how birth details and floor plans are protected, and what a reading can and cannot do — before you book.`}
        primaryHref="/contact"
        primaryLabel="Ask a question"
        secondaryHref="/services"
        secondaryLabel="See the services"
        motif="compass"
        id="ask"
      />
    </>
  );
}
