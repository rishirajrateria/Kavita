import { CtaDisc } from "@/components/content";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { GEO_SERVICE_META, geoBookHref } from "@/lib/geo/service";
import type { Question } from "./answers";

/**
 * The closing plate: the parchment disc on the deepest night (SPEC §2.3 `CtaDisc`) — book the
 * integrated reading pre-filled with the place; WhatsApp as the secondary action when the number
 * is real, otherwise the contact page. The H2 is real and its answer is an `.answer` that an
 * `/admin/aeo` override for `(route, "book")` replaces.
 */
export function GeoCta({
  loc,
  service,
  question,
  route,
  whatsappHref,
}: {
  loc: LocationRecord;
  service: GeoService;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides (`h2_id` = `book`). */
  route?: string;
  whatsappHref: string | null;
}) {
  return (
    <CtaDisc
      id="book"
      route={route}
      asAnswer
      eyebrow={question.eyebrow}
      title={question.question}
      body={question.answer}
      primaryHref={geoBookHref(loc)}
      primaryLabel={`Book from ${loc.shortName ?? loc.name}`}
      secondaryHref={whatsappHref ?? "/contact"}
      secondaryLabel={whatsappHref ? "Message on WhatsApp" : "Ask a question first"}
      motif={GEO_SERVICE_META[service].motif === "compass" ? "compass" : "south-chart"}
    />
  );
}
