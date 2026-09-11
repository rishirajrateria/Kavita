import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { Byline, CtaBand, FaqBlock, PageHero, QuestionSection } from "@/components/content";
import { ServicesComparisonTable } from "@/components/services/comparison-table";
import { ServiceCard } from "@/components/services/service-card";
import { Container } from "@/components/ui/container";
import {
  LEAD_DESCRIPTION,
  LEAD_LABEL,
  SERVICES_COMPARISON,
  SERVICES_CTA,
  SERVICES_DATES,
  SERVICES_FAQ,
  SERVICES_HERO,
  SERVICES_INTRO,
  SERVICES_LIST,
  SERVICES_META,
} from "@/content/pages/services";
import { getServices, type ServiceLead } from "@/lib/data";

const BASE_METADATA: Metadata = {
  title: { absolute: SERVICES_META.title },
  description: SERVICES_META.description,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: SERVICES_META.title,
    description: SERVICES_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/services");
}

const LEADS: ServiceLead[] = ["integrated", "astrology", "vastu"];

/** All services (CLAUDE.md §5): intro, comparison table, cards, FAQ. Static; no client JS. */
export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <PageHero
        eyebrow={SERVICES_HERO.eyebrow}
        title={SERVICES_HERO.title}
        lede={SERVICES_HERO.lede}
        motif="north-chart"
        breadcrumbs={[{ name: "Services", href: "/services" }]}
      />
      <Container size="wide">
        <Byline datePublished={SERVICES_DATES.published} dateModified={SERVICES_DATES.modified} />
      </Container>

      <QuestionSection
        route="/services"
        id={SERVICES_INTRO.id}
        eyebrow={SERVICES_INTRO.eyebrow}
        question={SERVICES_INTRO.question}
        answer={SERVICES_INTRO.answer}
        bodyClassName="max-w-prose"
      >
        {SERVICES_INTRO.body.map((p) => (
          <p key={p} className="leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        <dl className="grid gap-4 sm:grid-cols-3">
          {LEADS.map((lead) => (
            <div
              key={lead}
              className="rounded-lg border border-accent-border/40 bg-surface-muted p-4"
            >
              <dt className="font-sans text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase">
                {LEAD_LABEL[lead]}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed">{LEAD_DESCRIPTION[lead]}</dd>
            </div>
          ))}
        </dl>
      </QuestionSection>

      <QuestionSection
        route="/services"
        id={SERVICES_COMPARISON.id}
        eyebrow={SERVICES_COMPARISON.eyebrow}
        question={SERVICES_COMPARISON.question}
        answer={SERVICES_COMPARISON.answer}
        tone="muted"
      >
        <ServicesComparisonTable services={services} />
      </QuestionSection>

      <QuestionSection
        route="/services"
        id={SERVICES_LIST.id}
        eyebrow={SERVICES_LIST.eyebrow}
        question={SERVICES_LIST.question}
        answer={SERVICES_LIST.answer}
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug} className="flex">
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Every service is available online worldwide.{" "}
          <Link href="/contact" className="text-accent-strong">
            Ask which fits
          </Link>{" "}
          if you are unsure.
        </p>
      </QuestionSection>

      <FaqBlock
        route="/services"
        heading={SERVICES_FAQ.heading}
        answer={SERVICES_FAQ.answer}
        eyebrow={SERVICES_FAQ.eyebrow}
        items={[...SERVICES_FAQ.items]}
        tone="muted"
      />

      <CtaBand
        title={SERVICES_CTA.title}
        body={SERVICES_CTA.body}
        primaryHref={SERVICES_CTA.primaryHref}
        primaryLabel={SERVICES_CTA.primaryLabel}
        secondaryHref={SERVICES_CTA.secondaryHref}
        secondaryLabel={SERVICES_CTA.secondaryLabel}
      />
    </>
  );
}
