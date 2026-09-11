/**
 * Location-specific body text of a geo page as plain text (Phase 2 contract). Pure and
 * synchronous: the uniqueness gate (`scripts/validate-content.ts`) calls it for every
 * publishable location × service and compares pages by shingle/Jaccard similarity, so ONLY the
 * text that is unique to the place belongs here — never the shared brand sections.
 */
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { cityTable, tableText } from "./tables";

export function getGeoPageText(loc: LocationRecord, service: GeoService): string {
  const r = loc.research;
  if (!r) return "";
  const astrology = service === "astrologer";

  const parts: string[] = [
    astrology ? r.opening.astrologer : r.opening.vastu,
    astrology ? r.tradition.narrative : r.climateArchitecture.narrative,
    astrology
      ? [r.tradition.calendar, r.tradition.birthRecordsNote].join("\n")
      : [r.climateArchitecture.housingStock, ...r.climateArchitecture.facts].join("\n"),
    r.consultingFrom,
    ...r.faqs.map((f) => `${f.question}\n${f.answer}`),
    ...r.landmarks.map((l) => (l.note ? `${l.name}: ${l.note}` : l.name)),
    ...r.clientConcerns,
  ];

  if (loc.type === "city") {
    const table = cityTable(loc, service);
    if (table) parts.push(tableText(table));
  }

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}
