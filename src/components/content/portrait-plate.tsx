import Image from "next/image";
import type { PlanetKey } from "@/components/motifs";
import { PRACTITIONER } from "@/content/practitioner";
import { cn } from "@/lib/utils";
import { Orb } from "./orb";

export interface PortraitPlateProps {
  /** The practitioner's name (from `site_settings`). */
  name: string;
  /** The line under the name; defaults to the job title. */
  caption?: string;
  /** The planet of place, drawn small beside the caption. */
  planet?: PlanetKey;
  priority?: boolean;
  className?: string;
}

/**
 * The practitioner (SPEC §2.3): the arch portrait on one glass plate, levitating, a halo of
 * `--glow` behind it. The placeholder photograph and its placeholder alt stay exactly as they
 * are until `{{PRACTITIONER PHOTO}}` arrives.
 */
export function PortraitPlate({
  name,
  caption = PRACTITIONER.jobTitle,
  planet,
  priority = false,
  className,
}: PortraitPlateProps) {
  return (
    <figure className={cn("portrait-plate relative mx-auto w-full max-w-[20rem]", className)}>
      {/* The halo is a box-shadow, so it glows past the plate without adding scroll width. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[10%] rounded-full"
        style={{ boxShadow: "0 0 90px 48px var(--glow)" }}
      />
      <div
        data-levitate
        className="glass sheen relative p-4 sm:p-5"
        style={{ ["--sheen-delay" as string]: "4s" }}
      >
        <div className="arch arch-frame relative overflow-hidden border border-accent-border/50 bg-linear-to-b from-card to-muted">
          <Image
            src={PRACTITIONER.photo.src}
            width={PRACTITIONER.photo.width}
            height={PRACTITIONER.photo.height}
            alt={PRACTITIONER.photo.alt(name)}
            sizes="20rem"
            priority={priority}
            className="block h-auto w-full"
          />
        </div>
        <figcaption className="mt-5 text-center">
          <span className="block font-serif text-2xl leading-snug text-foreground">{name}</span>
          <span className="mt-1 block font-sans text-[0.8rem] text-muted-foreground">
            {caption}
          </span>
          {planet ? <Orb planet={planet} size="xs" className="mt-3" /> : null}
        </figcaption>
      </div>
    </figure>
  );
}
