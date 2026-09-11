import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { notFound } from "next/navigation";
import {
  Byline,
  CtaBand,
  FaqBlock,
  KeyFacts,
  PageHero,
  QuestionSection,
  Toc,
} from "@/components/content";
import { Ornament } from "@/components/motifs";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadBadge } from "@/components/services/lead-badge";
import { servicePrice } from "@/components/services/price";
import { ServiceCard } from "@/components/services/service-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAD_LABEL, SERVICE_PAGE } from "@/content/pages/services";
import { PRACTITIONER } from "@/content/practitioner";
import { detailSections, getServiceDetail, type ServiceDetail } from "@/content/service-details";
import {
  getCountries,
  getServiceBySlug,
  getServices,
  getSiteSettings,
  type Service,
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

function PrepareBody({ detail, service }: { detail: ServiceDetail; service: Service }) {
  const table = detail.whatToPrepare.table;
  if (table) {
    const [chartCol, vastuCol] = SERVICE_PAGE.prepareTable.columns;
    const rows = Math.max(table.chart.length, table.vastu.length);
    return (
      <Table
        containerClassName="rounded-xl border border-t-2 border-t-accent-border shadow-sm"
        className="text-base"
      >
        <TableCaption className="px-4 pb-4 text-left">
          {SERVICE_PAGE.prepareTable.caption}
        </TableCaption>
        <TableHeader>
          <TableRow className="border-b-2 hover:bg-transparent">
            <TableHead
              scope="col"
              className="h-auto px-5 py-4 font-serif text-lg font-medium whitespace-normal text-foreground"
            >
              {chartCol}
            </TableHead>
            <TableHead
              scope="col"
              className="h-auto px-5 py-4 font-serif text-lg font-medium whitespace-normal text-foreground"
            >
              {vastuCol}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i} className="even:bg-surface-muted/40 hover:bg-transparent">
              <TableCell className="min-w-[14rem] px-5 py-4 align-top leading-relaxed whitespace-normal">
                {table.chart[i] ?? ""}
              </TableCell>
              <TableCell className="min-w-[14rem] px-5 py-4 align-top leading-relaxed whitespace-normal">
                {table.vastu[i] ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  const items = detail.whatToPrepare.items ?? service.whatToPrepare;
  return (
    <ul className="max-w-prose space-y-2 leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <Ornament className="mt-2 size-3 shrink-0 text-accent-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** One service page: key facts, six question sections, FAQ, related services, CTA (§5, §9). */
export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const [service, detail] = [await getServiceBySlug(slug), getServiceDetail(slug)];
  if (!service || !detail) notFound();

  const [settings, services, countries] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
  ]);
  const siteUrl = getSiteUrl();
  const price = servicePrice(service);
  const languages = realValue(PRACTITIONER.languages);
  const modes = service.deliveryModes.map((m) => SERVICE_PAGE.modeLabel[m]).join("; ");
  const related = detail.related
    .map((s) => services.find((x) => x.slug === s))
    .filter((s): s is Service => Boolean(s));
  const sections = detailSections(detail);
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
    url: absoluteUrl(`/services/${slug}`),
    siteUrl,
    areaServed: countries.map((c) => ({ "@type": "Country" as const, name: c.name })),
    offers: price.offer ? [price.offer] : undefined,
    channels: service.deliveryModes,
  });

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        eyebrow={`Service · ${LEAD_LABEL[service.lead]}`}
        title={service.name}
        lede={detail.lede}
        motif={
          service.lead === "vastu"
            ? "compass"
            : service.lead === "astrology"
              ? "north-chart"
              : "south-chart"
        }
        breadcrumbs={[
          { name: "Services", href: "/services" },
          { name: service.name, href: `/services/${slug}` },
        ]}
        actions={
          <>
            <Button asChild variant="gold" size="xl">
              <a href={`/book?service=${slug}`}>{SERVICE_PAGE.cta.primaryLabel}</a>
            </Button>
            <LeadBadge lead={service.lead} className="ml-1" />
            <span className="text-sm text-muted-foreground">{service.durationMinutes} min</span>
          </>
        }
      />
      <Container size="wide">
        <Byline datePublished={detail.datePublished} dateModified={detail.dateModified} />
      </Container>

      <KeyFacts heading={SERVICE_PAGE.keyFactsHeading(service.name)} items={facts} />
      {price.placeholder ? (
        <Container size="wide">
          <p className="py-3 text-sm text-muted-foreground" data-placeholder="price">
            The fee for this service is confirmed on request before any session is booked.
          </p>
        </Container>
      ) : null}

      <Toc
        items={[
          ...sections.map((s) => ({
            id: s.id,
            text: s.section.question.replace(/ with Astrologer Kavita\??$/, "").replace(/\?$/, ""),
          })),
          { id: "faq", text: "FAQ" },
        ]}
      />

      {sections.map(({ id, section }, i) => (
        <QuestionSection
          key={id}
          id={id}
          question={section.question}
          answer={section.answer}
          tone={i % 2 === 1 ? "muted" : "default"}
          bodyClassName={
            id === "what-to-prepare" && detail.whatToPrepare.table ? undefined : "max-w-prose"
          }
        >
          {section.body.map((p) => (
            <p key={p} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
          {id === "what-to-prepare" ? <PrepareBody detail={detail} service={service} /> : null}
          {id === "what-you-receive" && service.whatYouReceive.length ? (
            <ul className="max-w-prose space-y-2 leading-relaxed">
              {service.whatYouReceive.map((item) => (
                <li key={item} className="flex gap-3">
                  <Ornament className="mt-2 size-3 shrink-0 text-accent-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {id === "what-is-included" && section.items ? (
            <ul className="max-w-prose space-y-2 leading-relaxed">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <Ornament className="mt-2 size-3 shrink-0 text-accent-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </QuestionSection>
      ))}

      <FaqBlock
        route={`/services/${slug}`}
        heading={SERVICE_PAGE.faq.heading(service.name)}
        eyebrow={SERVICE_PAGE.faq.eyebrow}
        items={[...detail.faqs]}
        tone="muted"
      />

      {related.length ? (
        <Section id="related" spacing="lg" aria-labelledby="related-heading">
          <Container size="wide" className="space-y-8">
            <Heading
              as="h2"
              level={2}
              id="related-heading"
              eyebrow={SERVICE_PAGE.related.eyebrow}
              className="max-w-[26ch]"
            >
              {SERVICE_PAGE.related.heading}
            </Heading>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <li key={s.slug} className="flex">
                  <ServiceCard service={s} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CtaBand
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
