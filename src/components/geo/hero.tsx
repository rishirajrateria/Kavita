import Link from "next/link";
import { SceneHero } from "@/components/content";
import { Disc, VastuDirections } from "@/components/motifs";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { LinkGraph } from "@/lib/geo/linking";
import { GEO_SERVICE_META, geoBookHref, geoH1 } from "@/lib/geo/service";
import { ChartInstrument } from "./chart-instrument";
import { GHOST } from "./parts";

/**
 * From `lg`, the Earth's horizon is re-seated so its lit arc rises in the left margin beside the
 * chart and falls away under the lede's left edge — the geo scene is taller than the home hero,
 * and at its default seat the planet ran under the lede and the entity line (no text over a
 * figure). Below `lg` the default seat already keeps it under the fold of the scene.
 */
const EARTH_BESIDE_CHART =
  "lg:[&>svg]:top-[26rem] lg:[&>svg]:bottom-auto lg:[&>svg]:left-[calc(50vw-1790px)] lg:[&>svg]:w-[1400px] lg:[&>svg]:max-w-none";

/**
 * The opening scene of a geo page (SPEC §3, geo rows): breadcrumb trail (visible + JSON-LD),
 * the page's only H1, the ruled tagline, one instrument drawn large on the night — the North
 * Indian chart for the astrologer family, the vastu purusha mandala for the vastu family — then
 * the one-line subhead for the place, the parchment disc and the counterpart link, and the
 * entity sentence. Country pages carry the Earth's lit horizon. No client JavaScript.
 */
export function GeoHero({
  loc,
  service,
  graph,
  countryName,
}: {
  loc: LocationRecord;
  service: GeoService;
  graph: LinkGraph;
  /** Country the place belongs to (from the full ancestor chain, publishable or not). */
  countryName: string;
}) {
  const meta = GEO_SERVICE_META[service];
  const trail = [
    ...graph.ancestors.map((a) => ({ name: a.name, href: graph.href(a) })),
    { name: loc.name, href: graph.href(loc) },
  ];
  const eyebrow =
    loc.type === "country"
      ? `${meta.label} · online across ${loc.name}`
      : `${meta.label} · ${countryName}`;
  const lede =
    service === "astrologer"
      ? `Vedic astrology and vastu, read together as one consultation for clients ${loc.type === "country" ? "across" : "in"} ${loc.name} — online, in ${loc.name}'s own hours, with the home read as part of the same picture.`
      : `Vastu shastra for homes and workplaces ${loc.type === "country" ? "across" : "in"} ${loc.name}, read together with the occupants' birth charts — from a floor plan and photographs, in ${loc.name}'s own hours.`;

  return (
    <SceneHero
      id="geo-hero"
      title={geoH1(loc, service)}
      tagline={eyebrow}
      lede={lede}
      breadcrumbs={trail}
      earth={loc.type === "country"}
      className={loc.type === "country" ? EARTH_BESIDE_CHART : undefined}
      figureSize="half"
      figureRatio="1/1"
      figure={
        meta.motif === "compass" ? (
          <VastuDirections className="text-accent-strong" />
        ) : (
          <ChartInstrument className="text-accent-strong" />
        )
      }
      actions={
        <>
          <Disc
            size="sm"
            href={geoBookHref(loc)}
            label="Book a consultation"
            className="[&_.disc-link]:text-[0.58rem]"
          />
          <Link href={graph.counterpart.href} className={GHOST}>
            {graph.counterpart.label}
            <span aria-hidden="true" data-arrow className="inline-block">
              →
            </span>
          </Link>
        </>
      }
      entity={
        <>
          {loc.name} keeps {loc.timezone}. Consultations in {loc.languages.join(", ")}. Astrologer
          Kavita reads the kundli — the Vedic birth chart — and the vastu of the home as one method
          with two instruments, never as two separate services.
        </>
      }
    />
  );
}
