import { Fragment } from "react";
import { CtaDisc, SceneHero, Toc, formatDisplayDate, type TocItem } from "@/components/content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LegalDocument } from "@/content/legal";
import { getLegalContext } from "./context";
import { LegalLines } from "./legal-lines";
import { LegalDivider, LegalSection } from "./legal-section";

/**
 * Shared layout of `/privacy`, `/terms` and `/disclaimer` in the language of the home hero
 * (SPEC §3): the astronomical linework as the one instrument under the Cinzel H1 and its ruled
 * tagline, the lede and the issued-by line visible, the "On this page" rail, then every section
 * as a numbered plate on one quiet pane — numeral, question H2, `.answer`, every block visible,
 * the divider mark on a hairline between — and the parchment disc to close. Legal text is never
 * folded. Server component; JSON-LD is the BreadcrumbList only (no FAQ/Article markup on legal text).
 */
export async function LegalPage({ doc }: { doc: LegalDocument }) {
  const ctx = await getLegalContext();
  const toc: TocItem[] = doc.sections.map((s, i) => ({
    id: s.id,
    text: s.tocLabel ?? s.heading,
    level: 2,
    n: String(i + 1).padStart(2, "0"),
  }));
  const modified = doc.dateModified !== doc.datePublished ? doc.dateModified : undefined;

  return (
    <>
      <SceneHero
        title={doc.title}
        tagline={`${doc.eyebrow} · ${ctx.brandName}`}
        lede={doc.lede}
        figureSize="small"
        figureRatio="16/9"
        figure={
          <LegalLines description="Thin orbital arcs around one central body, with the ecliptic drawn as a ticked arc across the frame." />
        }
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

      <Section as="div" tone="muted" spacing="none" className="pt-4 pb-12 sm:pb-16">
        <Container size="wide">
          {doc.sections.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 ? <LegalDivider /> : null}
              <LegalSection section={section} index={index} />
            </Fragment>
          ))}
        </Container>
      </Section>

      <CtaDisc
        id="ask"
        eyebrow="Questions"
        title="Anything here you would like explained?"
        body={`${ctx.brandName} answers questions about how a consultation works, how birth details and floor plans are protected, and what a reading can and cannot do — before you book.`}
        primaryHref="/contact"
        primaryLabel="Ask a question"
        secondaryHref="/services"
        secondaryLabel="See the services"
        motif="compass"
      />
    </>
  );
}
