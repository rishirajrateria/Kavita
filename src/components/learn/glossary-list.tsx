import { DoorField, type Door } from "@/components/content";
import type { GlossaryTerm } from "@/content/glossary";

/** A term's door: the chart for an astrology term, the compass rose for a vastu term. */
function termDoor(t: GlossaryTerm, withShort: boolean): Door {
  return {
    href: `/glossary/${t.slug}`,
    label: t.term,
    motif: t.category === "vastu" ? "compass" : "north-chart",
    ...(withShort ? { line: t.short, meta: t.sanskrit } : {}),
  };
}

/**
 * The glossary as a ruled field of doors — every `short` definition visible in the HTML, so the
 * index page itself answers "what is a dasha" without a click. Two columns from tablet width;
 * each term links to its own page and carries the instrument of its science. Rendered in a
 * plate's `figure` slot, so it fills the figure's measure.
 */
export function GlossaryList({ terms, id }: { terms: GlossaryTerm[]; id?: string }) {
  if (terms.length === 0) return null;
  return (
    <div id={id} className="w-full">
      <DoorField doors={terms.map((t) => termDoor(t, true))} variant="station" columns={2} />
    </div>
  );
}

/** Inline chips of term links (related terms, "terms in this article") under a Cinzel caption. */
export function TermChips({ terms, label }: { terms: GlossaryTerm[]; label: string }) {
  if (terms.length === 0) return null;
  return (
    <div className="space-y-4">
      <p className="plate-n">{label}</p>
      <DoorField doors={terms.map((t) => termDoor(t, false))} variant="chip" />
    </div>
  );
}
