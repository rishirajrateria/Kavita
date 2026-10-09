import type * as React from "react";
import { PLANETS, type PlanetKey } from "@/components/motifs";
import { cn } from "@/lib/utils";
import { hubHouseFor } from "./hub-house";
import type { DoorMotif } from "./motif-sprite";

export interface Door {
  href: string;
  /** Cinzel capitals; two or three words. */
  label: string;
  /** One visible line of Cormorant under the label — never moved into `title`. */
  line?: string;
  /** Data-built meta, e.g. `Astrology-led · 60 min`, `3 guides`, `Region`. */
  meta?: string;
  /** The sprite glyph for an href outside the hub (`MotifSprite` must be on the page). */
  motif?: DoorMotif;
  /** Only ever the sentence from `HUB.houses[].title`; derived when the href is a house. */
  title?: string;
  /** Hold the hover state at rest — the current page, or a service's own house. */
  lit?: boolean;
}

export interface DoorFieldProps {
  doors: Door[];
  columns?: 2 | 3 | 4;
  as?: "ul" | "ol";
  /** `tile`: a grid card. `station`: a ruled row. `chip`: an inline pill. */
  variant?: "tile" | "station" | "chip";
  /** An `aria-hidden` SVG the doors are laid over when `positioned` (desktop only). */
  lines?: React.ReactNode;
  /** Per-door positions as percentages of the `lines` figure, ≥ 768 px; a grid below that. */
  positioned?: { x: number; y: number }[];
  className?: string;
}

/** The glow a door tints with: its planet's, or brass for a place or a page outside the hub. */
const PLACE_GLOW = "var(--brass-300)";

function Glyph({ planet, motif }: { planet?: PlanetKey; motif?: DoorMotif }) {
  if (planet) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an animated SVG drawing with its own <style>; next/image would strip nothing and add nothing
      <img
        src={`/planets/${planet}.svg`}
        width={40}
        height={40}
        alt=""
        loading="lazy"
        decoding="async"
        className="door-glyph"
      />
    );
  }
  if (motif) {
    return (
      <svg className="door-glyph" aria-hidden="true" focusable="false">
        <use href={`#m-${motif}`} />
      </svg>
    );
  }
  return null;
}

function DoorLink({
  door,
  variant,
}: {
  door: Door;
  variant: NonNullable<DoorFieldProps["variant"]>;
}) {
  const house = hubHouseFor(door.href);
  const planet = house?.planet;
  const glow = planet ? PLANETS[planet].glow : PLACE_GLOW;
  const hasGlyph = Boolean(planet || door.motif);

  return (
    <a
      href={door.href}
      title={door.title ?? house?.title}
      className={cn("door group", `door--${variant}`)}
      data-lit={door.lit ? "" : undefined}
      style={
        {
          "--door-glow": glow,
          cursor: planet ? `url(/cursors/${planet}.png) 16 16, pointer` : undefined,
        } as React.CSSProperties
      }
    >
      {hasGlyph ? (
        <span className="door-glyph-wrap">
          <span aria-hidden="true" className="door-halo" />
          <Glyph planet={planet} motif={door.motif} />
        </span>
      ) : null}
      <span className="door-label font-display text-[0.72rem] font-medium tracking-[0.18em] text-foreground uppercase max-[390px]:text-[0.62rem]">
        {door.label}
      </span>
      <span
        aria-hidden="true"
        className="door-rule"
        data-draw
        style={{ ["--draw-length" as string]: "22" }}
      />
      {door.line ? (
        <span className="door-line block font-serif text-base leading-snug text-muted-foreground">
          {door.line}
        </span>
      ) : null}
      {door.meta ? (
        <span className="door-meta block font-sans text-[0.68rem] tracking-[0.1em] text-muted-foreground uppercase">
          {door.meta}
        </span>
      ) : null}
    </a>
  );
}

/**
 * Every list is a door (SPEC §2.3): real HTML `<a>`s in reading order, each glowing in its
 * planet's colour under the hand when its href is a house of the hub (`hubHouseFor`), or
 * carrying a sprite glyph when it is not. `positioned` lays the same elements over a figure on
 * wide screens; below 768 px they fall into a two-column grid — one DOM, no duplicate links.
 */
export function DoorField({
  doors,
  columns = 3,
  as: List = "ul",
  variant = "tile",
  lines,
  positioned,
  className,
}: DoorFieldProps) {
  if (doors.length === 0) return null;
  const overlay = Boolean(positioned && lines);

  const list = (
    <List
      className={cn("door-field", className)}
      data-columns={columns}
      data-variant={variant}
      data-positioned={overlay ? "" : undefined}
    >
      {doors.map((door, i) => {
        const at = overlay ? positioned?.[i] : undefined;
        return (
          <li
            key={door.href + door.label}
            style={
              at ? ({ "--x": `${at.x}%`, "--y": `${at.y}%` } as React.CSSProperties) : undefined
            }
          >
            <DoorLink door={door} variant={variant} />
          </li>
        );
      })}
    </List>
  );

  if (!overlay) return list;
  return (
    <div className="door-stage">
      <div aria-hidden="true" className="door-lines">
        {lines}
      </div>
      {list}
    </div>
  );
}
