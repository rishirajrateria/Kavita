import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { Byline, CtaBand, PageHero, QuestionSection, Toc } from "@/components/content";
import { FaqGroup, type FaqSubgroup } from "@/components/faq/faq-group";
import { FaqSearch } from "@/components/faq/faq-search";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { ASTROLOGY_FAQ } from "@/content/pages/astrology";
import { FAQ_CTA, FAQ_DATES, FAQ_GROUPS, FAQ_HERO, FAQ_INTRO, FAQ_META } from "@/content/pages/faq";
import { VASTU_FAQ } from "@/content/pages/vastu";
import { SERVICE_DETAILS } from "@/content/service-details";
import {
  getCountries,
  getFaqsForRoute,
  getFeaturedCities,
  getServices,
  locationHref,
} from "@/lib/data";
import { faqPageSchema, withSpeakable, type FaqItem } from "@/lib/seo/schema";

const BASE_METADATA: Metadata = {
  title: { absolute: FAQ_META.title },
  description: FAQ_META.description,
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: "/faq",
    title: FAQ_META.title,
    description: FAQ_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/faq");
}

/**
 * Master FAQ (CLAUDE.md §5): home, service, astrology, vastu and location questions in one
 * page, every answer in the HTML. The search box is the page's only client component and only
 * hides non-matching `<details>`.
 */
export default async function FaqPage() {
  // Countries and featured cities only: every publishable location would put ~300 questions
  // (over a megabyte of HTML) on one page. Each city page carries its own FAQ in full.
  const [homeFaqs, services, countries, cities] = await Promise.all([
    getFaqsForRoute("/"),
    getServices(),
    getCountries(),
    getFeaturedCities(),
  ]);
  const locations = [...countries, ...cities];
  const G = FAQ_GROUPS;

  const general: FaqSubgroup[] = [
    {
      title: G.general.eyebrow,
      items: homeFaqs.map(({ question, answer }) => ({ question, answer })),
    },
  ];
  const serviceGroups: FaqSubgroup[] = [];
  for (const s of services) {
    const d = SERVICE_DETAILS.find((x) => x.slug === s.slug);
    if (d) serviceGroups.push({ title: s.name, href: `/services/${s.slug}`, items: [...d.faqs] });
  }
  const astrology: FaqSubgroup[] = [
    { title: "Vedic astrology", href: "/astrology", items: [...ASTROLOGY_FAQ.items] },
  ];
  const vastu: FaqSubgroup[] = [{ title: "Vastu", href: "/vastu", items: [...VASTU_FAQ.items] }];
  const locationGroups: FaqSubgroup[] = locations
    .filter((l) => l.research && l.research.faqs.length > 0)
    .map((l) => ({
      title: l.name,
      href: locationHref(l, "astrologer"),
      items: l.research?.faqs.map(({ question, answer }) => ({ question, answer })) ?? [],
    }));

  const all: FaqItem[] = [general, serviceGroups, astrology, vastu, locationGroups]
    .flat()
    .flatMap((g) => g.items);
  const toc = [
    { id: G.general.id, text: G.general.eyebrow },
    { id: G.services.id, text: G.services.eyebrow },
    { id: G.astrology.id, text: G.astrology.eyebrow },
    { id: G.vastu.id, text: G.vastu.eyebrow },
    ...(locationGroups.length ? [{ id: G.locations.id, text: G.locations.eyebrow }] : []),
  ];

  return (
    <>
      <JsonLd data={withSpeakable(faqPageSchema(all), [".answer"])} id="faq-schema" />
      <PageHero
        eyebrow={FAQ_HERO.eyebrow}
        title={FAQ_HERO.title}
        lede={FAQ_HERO.lede}
        motif="lines"
        breadcrumbs={[{ name: "FAQ", href: "/faq" }]}
      />
      <Container size="wide">
        <Byline datePublished={FAQ_DATES.published} dateModified={FAQ_DATES.modified} />
      </Container>

      <QuestionSection
        route="/faq"
        id={FAQ_INTRO.id}
        eyebrow={FAQ_INTRO.eyebrow}
        question={FAQ_INTRO.question}
        answer={FAQ_INTRO.answer}
        spacing="md"
      >
        <FaqSearch total={all.length} />
      </QuestionSection>

      <Toc items={toc} />

      <FaqGroup
        route="/faq"
        id={G.general.id}
        eyebrow={G.general.eyebrow}
        heading={G.general.heading}
        answer={G.general.answer}
        subgroups={general}
      />
      <FaqGroup
        route="/faq"
        id={G.services.id}
        eyebrow={G.services.eyebrow}
        heading={G.services.heading}
        answer={G.services.answer}
        subgroups={serviceGroups}
        tone="muted"
      />
      <FaqGroup
        route="/faq"
        id={G.astrology.id}
        eyebrow={G.astrology.eyebrow}
        heading={ASTROLOGY_FAQ.heading}
        answer={ASTROLOGY_FAQ.answer}
        subgroups={astrology}
      />
      <FaqGroup
        route="/faq"
        id={G.vastu.id}
        eyebrow={G.vastu.eyebrow}
        heading={VASTU_FAQ.heading}
        answer={VASTU_FAQ.answer}
        subgroups={vastu}
        tone="muted"
      />
      <FaqGroup
        route="/faq"
        id={G.locations.id}
        eyebrow={G.locations.eyebrow}
        heading={G.locations.heading}
        answer={G.locations.answer}
        subgroups={locationGroups}
      />

      <CtaBand
        title={FAQ_CTA.title}
        body={FAQ_CTA.body}
        primaryHref={FAQ_CTA.primaryHref}
        primaryLabel={FAQ_CTA.primaryLabel}
        secondaryHref={FAQ_CTA.secondaryHref}
        secondaryLabel={FAQ_CTA.secondaryLabel}
      />
    </>
  );
}
