import { MotifSprite } from "@/components/content";
import { JsonLd } from "@/components/seo/json-ld";
import type { LocationRecord, LocationType } from "@/content/locations/schema";
import {
  computeConsultationWindow,
  getAncestors,
  getPublishableLocations,
  getPublishedTestimonials,
  getSameAsUrls,
  getServices,
  getSiteSettings,
  locationHref,
} from "@/lib/data";
import type { GeoService, Service } from "@/lib/data/types";
import { getLinkGraph } from "@/lib/geo/linking";
import { GEO_SERVICE_META, INTEGRATED_SERVICE_SLUG, geoH1 } from "@/lib/geo/service";
import { cityTable, countryTable, modesTable, stateTable, type GeoTable } from "@/lib/geo/tables";
import {
  localBusinessSchema,
  placeChain,
  serviceSchema,
  type WithContext,
  type Thing,
} from "@/lib/seo/schema";
import { getSiteUrl, whatsappHref } from "@/lib/site";
import {
  architectureQuestion,
  childrenQuestion,
  combinedQuestion,
  consultingQuestion,
  ctaQuestion,
  faqQuestion,
  linksQuestion,
  openingQuestion,
  tableQuestion,
  testimonialQuestion,
  traditionQuestion,
  type AnswerContext,
} from "./answers";
import { GeoArchitecture } from "./architecture";
import { GeoChildrenGrid } from "./children-grid";
import { GeoCombinedMethod } from "./combined-method";
import { GeoConsultingFrom } from "./consulting-from";
import { GeoCta } from "./cta";
import { GeoFaq } from "./faq";
import { GeoHero } from "./hero";
import { GeoKeyFacts } from "./key-facts";
import { GeoLinks } from "./links";
import { GeoLocationTable } from "./location-table";
import { GeoOpening } from "./opening";
import { GeoTestimonial } from "./testimonial";
import { plateCounter } from "./parts";
import { GeoTradition } from "./tradition";

export interface GeoPageProps {
  service: GeoService;
  loc: LocationRecord;
  level: LocationType;
}

/** Real price of the integrated service in the page's currency, if the client has supplied one. */
function realOffers(service: Service | undefined, currency: string) {
  if (!service) return undefined;
  const offers: { amountMinor: number; currency: string }[] = [];
  const local = service.prices[currency as keyof typeof service.prices];
  if (typeof local === "number" && local > 0) offers.push({ amountMinor: local, currency });
  else if (service.priceMinor && service.currency) {
    offers.push({ amountMinor: service.priceMinor, currency: service.currency });
  }
  return offers.length ? offers : undefined;
}

/**
 * The geo page template (CLAUDE.md §5–§9). One server component composes the blocks in a
 * tier-specific ORDER and PRESENCE so country, state and city pages are structurally distinct;
 * every block's copy comes from the location record and its hand-written research. Zero client
 * JavaScript is added by anything below.
 */
export async function GeoPage({ service, loc, level }: GeoPageProps) {
  const research = loc.research;
  if (!research) return null;

  const siteUrl = getSiteUrl();
  const [settings, services, graph, ancestors, sameAs, testimonials, publishable] =
    await Promise.all([
      getSiteSettings(),
      getServices(),
      getLinkGraph(loc, service),
      getAncestors(loc.path),
      getSameAsUrls(),
      research.testimonialId ? getPublishedTestimonials() : Promise.resolve([]),
      level === "country" ? getPublishableLocations() : Promise.resolve([]),
    ]);

  /** The page's canonical route — the same string `applyPageSeo` and `/admin/aeo` are keyed by. */
  const route = locationHref(loc, service);
  const window = computeConsultationWindow(loc, settings);
  const astro = service === "astrologer";
  const meta = GEO_SERVICE_META[service];
  const countryName = ancestors[0]?.name ?? loc.name;
  const ctx: AnswerContext = {
    loc,
    service,
    offsetMinutes: window.offsetMinutesFromPractitioner,
    localWindow: window.localStart ? window.localWindow : undefined,
    responseTimeHours: settings.responseTimeHours,
    siblingNames: graph.siblings.map((s) => s.shortName ?? s.name),
    childrenCount: graph.children.length,
  };

  // --- the page's table ----------------------------------------------------------------------
  let table: GeoTable | null;
  let tableKind: Parameters<typeof tableQuestion>[1];
  if (level === "country") {
    const descendants = publishable.filter(
      (l) => l.countryCode === loc.countryCode && l.path !== loc.path,
    );
    table = countryTable(loc, descendants, settings);
    tableKind = "timezones";
  } else if (level === "state") {
    table = stateTable(loc, graph.children, settings);
    tableKind = table ? "cities" : "modes";
    table ??= modesTable(loc, service, settings);
  } else {
    table = cityTable(loc, service);
    tableKind = astro ? "chart" : "vastu";
  }

  // --- testimonial: only a real, published, consented row (§12) ---------------------------------
  const testimonial = research.testimonialId
    ? testimonials.find(
        (t) =>
          t.id === research.testimonialId && t.isPublished && t.consentGiven && !t.isPlaceholder,
      )
    : undefined;

  // --- structured data -------------------------------------------------------------------------
  const pageUrl = `${siteUrl}${route}`;
  const place = placeChain([...ancestors, loc].map((l) => ({ type: l.type, name: l.name })));
  const integrated = services.find((s) => s.slug === INTEGRATED_SERVICE_SLUG);
  const jsonLd: WithContext<Thing>[] = [
    localBusinessSchema({ settings, sameAs, siteUrl, place, pageUrl }),
    serviceSchema({
      name: `${geoH1(loc, service)} — Vedic astrology and vastu read together`,
      serviceType: meta.serviceType,
      description: integrated?.shortDescription,
      url: pageUrl,
      siteUrl,
      areaServed: [place],
      offers: realOffers(integrated, loc.currency),
      channels: integrated?.deliveryModes,
    }),
  ];

  const wa = whatsappHref(settings.whatsapp);
  // Plates are numbered in DOM order and alternate default/muted panes (SPEC §2.3).
  const nextPlate = plateCounter();
  const opening = (
    <GeoOpening
      route={route}
      loc={loc}
      service={service}
      question={openingQuestion(ctx)}
      plate={nextPlate()}
    />
  );
  const children =
    level !== "city" && graph.children.length > 0 ? (
      <GeoChildrenGrid
        route={route}
        question={childrenQuestion(ctx)}
        href={graph.href}
        service={service}
        plate={nextPlate()}
      >
        {graph.children}
      </GeoChildrenGrid>
    ) : null;
  const combined =
    level !== "country" ? (
      <GeoCombinedMethod
        route={route}
        loc={loc}
        service={service}
        question={combinedQuestion(ctx)}
        plate={nextPlate()}
      />
    ) : null;
  const tradition = astro ? (
    <GeoTradition route={route} loc={loc} question={traditionQuestion(ctx)} plate={nextPlate()} />
  ) : (
    <GeoArchitecture
      route={route}
      loc={loc}
      question={architectureQuestion(ctx)}
      showRemoteProcess={level === "city"}
      plate={nextPlate()}
    />
  );
  const consulting =
    level !== "state" ? (
      <GeoConsultingFrom
        route={route}
        loc={loc}
        question={consultingQuestion(ctx)}
        window={window}
        practitionerTimezone={settings.timezone}
        businessHours={settings.businessHours}
        plate={nextPlate()}
      />
    ) : null;
  const locationTable = table ? (
    <GeoLocationTable
      route={route}
      table={table}
      question={tableQuestion(ctx, tableKind)}
      plate={nextPlate()}
    />
  ) : null;
  const keyFacts =
    level !== "state" ? (
      <GeoKeyFacts
        route={route}
        loc={loc}
        service={service}
        settings={settings}
        services={services}
        window={window}
        countryName={countryName}
      />
    ) : null;
  const faq = <GeoFaq route={route} faqs={research.faqs} question={faqQuestion(ctx)} />;
  const clientExperience =
    level === "city" && testimonial ? (
      <GeoTestimonial
        route={route}
        testimonial={testimonial}
        placeName={loc.name}
        question={testimonialQuestion(ctx)}
        plate={nextPlate()}
      />
    ) : null;
  const links =
    level !== "country" ? (
      <GeoLinks
        route={route}
        loc={loc}
        service={service}
        graph={graph}
        question={linksQuestion(ctx)}
        plate={nextPlate()}
      />
    ) : null;

  // Tier order and presence (country · state · city) are what make the three tiers distinct;
  // the plates are evaluated above in that same DOM order so their numerals read I, II, III….
  return (
    <>
      <JsonLd data={jsonLd} id="geo-schema" />
      <MotifSprite />
      <GeoHero loc={loc} service={service} graph={graph} countryName={countryName} />
      {keyFacts}
      {opening}
      {children}
      {combined}
      {tradition}
      {consulting}
      {locationTable}
      {faq}
      {clientExperience}
      {links}

      <GeoCta
        route={route}
        loc={loc}
        service={service}
        question={ctaQuestion(ctx)}
        whatsappHref={wa}
      />
    </>
  );
}
