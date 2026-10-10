import { Prose } from "@/components/content";
import { Ornament } from "@/components/motifs";
import type { LegalSection as LegalSectionData } from "@/content/legal";
import { cn } from "@/lib/utils";
import { LegalBlockView } from "./legal-blocks";

const H2 =
  "font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-[1.1] font-normal tracking-normal text-balance text-foreground";

/**
 * One section of a legal document as a plate in column mode (SPEC §2.3, §3): the numeral
 * `Section 01` as `.plate-n`, the question H2 beside it, then the `.answer` and every block
 * **visible** — legal text is never folded. A page-local plate rather than `FigureSection`,
 * because that primitive requires an answer and several legal sections have none (an empty
 * `.answer` would be a lie to answer engines). Nothing here is a figure: a legal section has no
 * instrument of the tradition to draw, so the plate is hairlines, air and type.
 */
export function LegalSection({ section, index }: { section: LegalSectionData; index: number }) {
  const numeral = String(index + 1).padStart(2, "0");
  const headingId = `${section.id}-heading`;

  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      className="scroll-mt-32 py-12 sm:py-14 lg:grid lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
        <p className="plate-n">Section {numeral}</p>
        <h2 id={headingId} className={cn(H2, "mt-4 max-w-[22ch]")}>
          {section.heading}
        </h2>
      </div>
      <div className="mt-6 lg:col-span-8 lg:mt-0">
        <Prose unbounded className="max-w-[42rem]">
          {section.answer ? (
            <p className="answer font-serif text-[1.15rem] leading-[1.55]">{section.answer}</p>
          ) : null}
          {section.blocks.map((block, i) => (
            <LegalBlockView key={`${section.id}-${i}`} block={block} />
          ))}
        </Prose>
      </div>
    </section>
  );
}

/** The hairline between two plates, with the traditional divider mark at its centre. */
export function LegalDivider() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4">
      <span className="h-px flex-1 bg-accent-border/30" />
      <Ornament className="size-4 text-accent-strong/70" strokeWidth={1.1} />
      <span className="h-px flex-1 bg-accent-border/30" />
    </div>
  );
}
