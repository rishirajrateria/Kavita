import { DoorField, FigureSection } from "@/components/content";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { LinkGraph } from "@/lib/geo/linking";
import { GEO_SERVICE_META } from "@/lib/geo/service";
import type { Question } from "./answers";
import { CAPTION_H3, SERVICE_MOTIF, WIDE_BLOCK, type Plate } from "./parts";

/**
 * The link graph made visible (CLAUDE.md §5) as three door fields: SIDEWAYS to 4–6 siblings as
 * tiles, ACROSS to the counterpart family and UP to the parent as ruled stations. Every href
 * comes from `getLinkGraph`, never typed here.
 */
export function GeoLinks({
  loc,
  service,
  graph,
  question,
  route,
  plate,
}: {
  loc: LocationRecord;
  service: GeoService;
  graph: LinkGraph;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  plate: Plate;
}) {
  const siblingLabel = loc.type === "state" ? "Other regions" : "Nearby cities";
  const meta = GEO_SERVICE_META[service];
  const counterpart = meta.counterpart;

  return (
    <FigureSection
      id="nearby"
      route={route}
      n={plate.n}
      tone={plate.tone}
      question={question.question}
      answer={question.answer}
      className={WIDE_BLOCK}
    >
      {graph.siblings.length > 0 ? (
        <div>
          <h3 className={CAPTION_H3}>{siblingLabel}</h3>
          <DoorField
            className="mt-5"
            variant="tile"
            columns={3}
            doors={graph.siblings.map((s) => ({
              href: graph.href(s),
              label: s.shortName ?? s.name,
              line: `${meta.label} in ${s.name}`,
              motif: SERVICE_MOTIF[service],
            }))}
          />
        </div>
      ) : null}

      <div className="grid gap-10 pt-4 md:grid-cols-2 md:gap-12">
        <div>
          <h3 className={CAPTION_H3}>The other half of the method</h3>
          <DoorField
            className="mt-3 md:grid-cols-1!"
            variant="station"
            columns={2}
            doors={[
              {
                href: graph.counterpart.href,
                label: graph.counterpart.label,
                line: `The same place, read from the ${service === "astrologer" ? "home" : "chart"} side.`,
                motif: SERVICE_MOTIF[counterpart],
              },
            ]}
          />
        </div>

        {graph.parent ? (
          <div>
            <h3 className={CAPTION_H3}>Up one level</h3>
            <DoorField
              className="mt-3 md:grid-cols-1!"
              variant="station"
              columns={2}
              doors={[
                {
                  href: graph.href(graph.parent),
                  label: `${meta.label} in ${graph.parent.name}`,
                  line: `Every city and region of ${graph.parent.name} on one page.`,
                  motif: SERVICE_MOTIF[service],
                },
              ]}
            />
          </div>
        ) : null}
      </div>
    </FigureSection>
  );
}
