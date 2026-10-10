import type * as React from "react";
import type { DoorMotif } from "@/components/content";
import type { GeoService } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/** Split a research paragraph on blank lines so long openings breathe. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The researched prose of a geo plate, always visible (CLAUDE.md §7): Karla on a reading
 * measure, muted, in the right-hand column of a `FigureSection layout="column"`.
 */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[62ch] space-y-5 font-sans text-base leading-[1.7] text-muted-foreground",
        className,
      )}
    >
      {paragraphs(text).map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </div>
  );
}

/**
 * The instrument of a column plate: a square capped at 18 rem on a phone and 24 rem beside the
 * prose, so a small figure never takes the whole screen (SPEC §2.3, small figures).
 */
export function SmallFigure({ children }: { children: React.ReactNode }) {
  return (
    <div className="mr-auto aspect-square w-full max-w-[18rem] lg:max-w-[24rem]">{children}</div>
  );
}

/** A small Cinzel caption heading over a ruled list or a door field (an `<h3>`). */
export const CAPTION_H3 =
  "flex items-center gap-4 font-display text-[0.68rem] font-semibold tracking-[0.22em] text-accent-strong uppercase after:h-px after:flex-1 after:bg-accent-border/40";

/** The ruled ghost link that sits beside a disc (as on `CtaDisc`). */
export const GHOST =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

/** The sprite glyph a place's door carries, by the family it opens. */
export const SERVICE_MOTIF: Record<GeoService, DoorMotif> = {
  astrologer: "north-chart",
  "vastu-consultant": "compass",
};

/**
 * A figure-less plate whose children are a door field: the ruled block widens to the doors'
 * measure while the answer keeps its reading measure (`FigureSection` sets 40 rem for prose).
 */
export const WIDE_BLOCK = "[&>div>div]:max-w-[64rem] [&_.answer]:max-w-[40rem]";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Plate numerals in DOM order, and the default/muted tone that alternates with them. */
export function plateCounter() {
  let i = 0;
  return () => {
    const n = ROMAN[i] ?? String(i + 1);
    const tone: "default" | "muted" = i % 2 === 0 ? "default" : "muted";
    i += 1;
    return { n, tone };
  };
}
export type Plate = ReturnType<ReturnType<typeof plateCounter>>;
