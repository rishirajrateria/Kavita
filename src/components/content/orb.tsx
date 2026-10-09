import type { PlanetKey } from "@/components/motifs";
import { cn } from "@/lib/utils";
import { Rule } from "./rule";

export interface OrbProps {
  planet: PlanetKey;
  /** 1.5 · 2.5 rem. Never larger: the planet of place is a mark, not a hero. */
  size?: "xs" | "sm";
  label?: string;
  className?: string;
}

const SIZE: Record<NonNullable<OrbProps["size"]>, string> = {
  xs: "size-6",
  sm: "size-10",
};

/**
 * The planet of place (SPEC §2.3): one small planet drawing, rendered once on a page whose
 * canonical route is a house of the hub (`hubHouseFor(route)`), never as a hero. Decorative —
 * the house's meaning is in the words beside it.
 */
export function Orb({ planet, size = "xs", label, className }: OrbProps) {
  return (
    <span className={cn("orb inline-flex items-center gap-3", className)} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- an animated SVG drawing with its own <style> */}
      <img
        src={`/planets/${planet}.svg`}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("block shrink-0", SIZE[size])}
      />
      {label ? (
        <Rule tone="muted" as="span">
          {label}
        </Rule>
      ) : null}
    </span>
  );
}
