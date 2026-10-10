import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { notFound } from "next/navigation";
import type * as React from "react";
import {
  Byline,
  CtaDisc,
  DoorField,
  FigureSection,
  Foot,
  KeyFacts,
  More,
  SceneHero,
  Toc,
  hubHouseFor,
} from "@/components/content";
import {
  Convergence,
  Disc,
  FloorPlan,
  Instrument,
  KundliNav,
  NorthIndianChart,
  Ornament,
  VastuCompass,
} from "@/components/motifs";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadBadge } from "@/components/services/lead-badge";
import { servicePrice } from "@/components/services/price";
import { Container } from "@/components/ui/container";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HUB, INSTRUMENTS } from "@/content/home";
import { LEAD_LABEL, SERVICE_PAGE } from "@/content/pages/services";
import { PRACTITIONER } from "@/content/practitioner";
import { detailSections, getServiceDetail, type ServiceDetail } from "@/content/service-details";
import {
  getCountries,
  getServiceBySlug,
  getServices,
  getSiteSettings,
  type Service,
  type ServiceLead,
} from "@/lib/data";
import { serviceSchema } from "@/lib/seo/schema";
import { absoluteUrl, getSiteUrl, realValue } from "@/lib/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  const services = await getServices();
  return services.filter((s) => getServiceDetail(s.slug)).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = getServiceDetail(slug);
  if (!detail) return {};
  return applyPageSeo(
    {
      title: { absolute: `${detail.metaTitle} — Astrologer Kavita` },
      description: detail.metaDescription,
      alternates: { canonical: `/services/${slug}` },
      openGraph: {
        type: "website",
        url: `/services/${slug}`,
        title: detail.metaTitle,
        description: detail.metaDescription,
      },
    },
    `/services/${slug}`,
  );
}

const SERVICE_TYPE = {
  astrology: "Vedic astrology consultation",
  vastu: "Vastu shastra consultation",
  integrated: "Integrated astrology and vastu consultation",
} as const;

const ROMAN = ["I", "II", "III", "IV", "V", "VI"] as const;

/**
 * The lit house's label takes its planet's glow — the hover colour, held at rest. The shared rule
 * (doors.css) sets it to `--accent-strong`, which by day is brass-700 on the chart's night
 * interior and fails contrast; this keeps the label legible in both themes. Important because
 * doors.css is unlayered and outranks a utility.
 */
const LIT_LABEL = "[&_.kundli-house[data-lit]_.kundli-house-label]:fill-(--house-glow)!";

/** Plate I's instrument, by which instrument leads: both, the chart, or the plan. */
function LeadFigure({ lead }: { lead: ServiceLead }) {
  const cls = "text-accent-strong";
  let node: React.ReactNode = <Instrument className={cls} />;
  if (lead === "astrology") node = <NorthIndianChart className={cls} />;
  if (lead === "vastu") node = <FloorPlan className={cls} />;
  return <div className="mx-auto w-full max-w-[24rem]">{node}</div>;
}

/**
 * Plate IV's instrument — what the inputs become. An integrated reading needs both the birth
 * details (the chart) and the plan (the home), drawn side by side as the table's two columns; a
 * vastu-led service needs a plan with north marked, so the compass rose. An astrology-led
 * service needs only birth details, whose instrument Plate I already draws — it gets none.
 */
function prepareFigureFor({ detail, lead }: { detail: ServiceDetail; lead: ServiceLead }) {
  if (detail.whatToPrepare.table) {
    return (
      <div className="grid w-full grid-cols-2 items-center gap-8 text-accent-strong sm:gap-16">
        <NorthIndianChart className="mx-auto w-full max-w-[13rem]" />
        <FloorPlan className="mx-auto w-full max-w-[13rem]" />
      </div>
    );
  }
  if (lead === "vastu") {
    return (
      <div className="mx-auto w-full max-w-[20rem] text-accent-strong">
        <VastuCompass />
      </div>
    );
  }
  return null;
}

/** A ruled list: hairline rows, an ornament before each item, Cormorant. Always visible. */
function RuledList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60">
      {items.map((item) => (
        <li key={item} className="flex gap-4 py-3 font-serif text-[1.05rem] leading-snug">
          <Ornament className="mt-1.5 size-3 shrink-0 text-accent-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const TH =
  "h-auto px-3 py-3 align-bottom font-display text-[0.62rem] font-semibold tracking-[0.22em] whitespace-normal text-accent-strong uppercase first:pl-0 last:pr-0";

/** The inputs for an integrated reading as a visible two-column table, or the plain ruled list. */
function PrepareBody({ detail, service }: { detail: ServiceDetail; service: Service }) {
  const table = detail.whatToPrepare.table;
  if (!table) return <RuledList items={detail.whatToPrepare.items ?? service.whatToPrepare} />;
  const [chartCol, vastuCol] = SERVICE_PAGE.prepareTable.columns;
  const rows = Math.max(table.chart.length, table.vastu.length);
  return (
    <Table className="text-base">
      <TableCaption className="px-0 pb-4 text-left font-sans text-sm text-muted-foreground">
        {SERVICE_PAGE.prepareTable.caption}
      </TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col" className={TH}>
            {chartCol}
          </TableHead>
          <TableHead scope="col" className={TH}>
            {vastuCol}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell className="py-3.5 pr-5 font-serif text-[1.05rem]" data-label={chartCol}>
              {table.chart[i] ?? ""}
            </TableCell>
            <TableCell className="py-3.5 font-serif text-[1.05rem]" data-label={vastuCol}>
              {table.vastu[i] ?? ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The three Cinzel phrases under the Convergence figure, set exactly as the home page sets them. */
function ConvergenceLine() {
  return (
    <span className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1">
      <span className="whitespace-nowrap">{INSTRUMENTS.captions.chart}</span>
      <span aria-hidden="true" className="hidden opacity-60 sm:inline">
        ·
      </span>
      <span className="whitespace-nowrap text-accent-strong">{INSTRUMENTS.captions.together}</span>
      <span aria-hidden="true" className="hidden opacity-60 sm:inline">
        ·
      </span>
      <span className="whitespace-nowrap">{INSTRUMENTS.captions.home}</span>
    </span>
  );
}

/** The paragraphs of a section, folded beneath its answer. */
function Fold({ body }: { body: readonly string[] }) {
  if (body.length === 0) return null;
  return (
    <More>
      {body.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </More>
  );
}

/**
 * One service page in the home hero's language (CLAUDE.md §4, §5, §9): the kundli hub at half
 * width with this service's own house lit — the house comes from `HUB`, never from this file —
 * the parchment disc as the action, the key facts, then six plates: the lead's instrument, the
 * ruled lists and the inputs table visible, every paragraph folded beneath its answer, the
 * Convergence figure for how it fits the method, the notes with the FAQs and the related doors,
 * and the disc. Every H2, answer, table, list and link is in the served HTML.
 */
export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const [service, detail] = [await getServiceBySlug(slug), getServiceDetail(slug)];
  if (!service || !detail) notFound();

  const [settings, services, countries] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
  ]);
  const route = `/services/${slug}`;
  const siteUrl = getSiteUrl();
  const price = servicePrice(service);
  const languages = realValue(PRACTITIONER.languages);
  const modes = service.deliveryModes.map((m) => SERVICE_PAGE.modeLabel[m]).join("; ");
  const related = detail.related
    .map((s) => services.find((x) => x.slug === s))
    .filter((s): s is Service => Boolean(s));
  const sections = detailSections(detail);
  const house = hubHouseFor(route);
  const L = SERVICE_PAGE.labels;

  const facts = [
    { label: L.service, value: service.name },
    { label: L.lead, value: LEAD_LABEL[service.lead] },
    { label: L.duration, value: `${service.durationMinutes} minutes` },
    { label: L.modes, value: modes.charAt(0).toUpperCase() + modes.slice(1) },
    { label: L.languages, value: languages ?? "To be confirmed" },
    { label: L.timezone, value: `${settings.timezone}; ${SERVICE_PAGE.timezoneNote}` },
    { label: L.responseTime, value: SERVICE_PAGE.responseTime(settings.responseTimeHours) },
    {
      label: L.price,
      value: price.alternatives.length
        ? `${price.text} (${price.alternatives.join(" / ")})`
        : price.text,
    },
  ];

  const schema = serviceSchema({
    name: service.name,
    serviceType: SERVICE_TYPE[service.lead],
    description: service.shortDescription,
    url: absoluteUrl(route),
    siteUrl,
    areaServed: countries.map((c) => ({ "@type": "Country" as const, name: c.name })),
    offers: price.offer ? [price.offer] : undefined,
    channels: service.deliveryModes,
  });

  /** What each plate shows beneath its answer, by section id. */
  const extras: Record<string, React.ReactNode> = {
    "what-is-included": <RuledList items={detail.whatIsIncluded.items ?? []} />,
    "what-to-prepare": <PrepareBody detail={detail} service={service} />,
    "what-you-receive": <RuledList items={service.whatYouReceive} />,
  };
  /** The plates that carry an instrument, each with its one ruled line beneath. */
  const prepareFigure = prepareFigureFor({ detail, lead: service.lead });
  const [chartCol, vastuCol] = SERVICE_PAGE.prepareTable.columns;
  const figures: Record<
    string,
    {
      node: React.ReactNode;
      line?: React.ReactNode;
      width: "narrow" | "default";
      ratio?: "2/1" | "1/1";
    }
  > = {
    "what-it-is": {
      node: <LeadFigure lead={service.lead} />,
      line: LEAD_LABEL[service.lead],
      width: "narrow",
    },
    ...(prepareFigure
      ? {
          "what-to-prepare": {
            node: prepareFigure,
            line: detail.whatToPrepare.table ? `${chartCol} · ${vastuCol}` : undefined,
            width: detail.whatToPrepare.table ? ("default" as const) : ("narrow" as const),
          },
        }
      : {}),
    "how-it-fits": {
      node: <Convergence className="text-accent-strong" />,
      line: <ConvergenceLine />,
      width: "default",
      ratio: "2/1",
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <SceneHero
        title={service.name}
        tagline={`Service · ${LEAD_LABEL[service.lead]}`}
        lede={detail.lede}
        figure={
          <KundliNav
            houses={HUB.houses}
            centre={HUB.centre}
            lit={house?.n}
            size="half"
            className={LIT_LABEL}
          />
        }
        figureSize="half"
        figureRatio="3/2"
        breadcrumbs={[
          { name: "Services", href: "/services" },
          { name: service.name, href: route },
        ]}
        actions={
          <>
            <Disc
              size="sm"
              href={`/book?service=${slug}`}
              label={SERVICE_PAGE.cta.primaryLabel}
              title={SERVICE_PAGE.cta.title(service.name)}
            />
            <span className="flex items-center gap-4">
              <LeadBadge lead={service.lead} />
              <span className="font-sans text-[0.8rem] text-muted-foreground">
                {service.durationMinutes} min
              </span>
            </span>
          </>
        }
      />
      <Container size="wide">
        <Byline
          datePublished={detail.datePublished}
          dateModified={detail.dateModified}
          withoutPhoto
        />
      </Container>

      <KeyFacts route={route} heading={SERVICE_PAGE.keyFactsHeading(service.name)} items={facts} />
      {price.placeholder ? (
        <Container size="wide">
          <p
            className="py-3 text-center font-sans text-sm text-muted-foreground"
            data-placeholder="price"
          >
            The fee for this service is confirmed on request before any session is booked.
          </p>
        </Container>
      ) : null}

      <Toc
        items={[
          ...sections.map((s, i) => ({
            id: s.id,
            n: ROMAN[i],
            text: s.section.question.replace(/ with Astrologer Kavita\??$/, "").replace(/\?$/, ""),
          })),
          { id: "faq", text: "FAQ" },
        ]}
      />

      {sections.map(({ id, section }, i) => {
        const figure = figures[id];
        return (
          <FigureSection
            key={id}
            id={id}
            route={route}
            n={ROMAN[i]}
            question={section.question}
            answer={section.answer}
            tone={i % 2 === 1 ? "muted" : "default"}
            figure={figure?.node}
            line={figure?.line}
            figureWidth={figure?.width}
            figureRatio={figure?.ratio}
          >
            {extras[id]}
            <Fold body={section.body} />
          </FigureSection>
        );
      })}

      <Foot route={route} heading={SERVICE_PAGE.faq.heading(service.name)} faqs={[...detail.faqs]}>
        {related.length ? (
          <div id="related" className="mt-14 scroll-mt-20">
            <h2 className="note-q">{SERVICE_PAGE.related.heading}</h2>
            <DoorField
              className="mt-8"
              columns={3}
              doors={related.map((s) => ({
                href: `/services/${s.slug}`,
                label: s.name,
                line: s.shortDescription,
                meta: `${LEAD_LABEL[s.lead]} · ${s.durationMinutes} min · ${servicePrice(s).text}`,
              }))}
            />
          </div>
        ) : null}
      </Foot>

      <CtaDisc
        title={SERVICE_PAGE.cta.title(service.name)}
        body={SERVICE_PAGE.cta.body}
        primaryHref={`/book?service=${slug}`}
        primaryLabel={SERVICE_PAGE.cta.primaryLabel}
        secondaryHref={SERVICE_PAGE.cta.secondaryHref}
        secondaryLabel={SERVICE_PAGE.cta.secondaryLabel}
        motif={service.lead === "vastu" ? "compass" : "south-chart"}
      />
    </>
  );
}
