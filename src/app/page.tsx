import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import {
  Comparison,
  FaqSection,
  FinalCta,
  Hero,
  HowItWorks,
  KeyFacts,
  Method,
  Serving,
  ServicesOverview,
  TestimonialsStrip,
} from "@/components/home";
import { JsonLd } from "@/components/seo/json-ld";
import { HOME_META } from "@/content/home";
import {
  getCountries,
  getFaqsForRoute,
  getFeaturedCities,
  getPublishedTestimonials,
  getServices,
  getSiteSettings,
} from "@/lib/data";
import { faqPageSchema, withSpeakable } from "@/lib/seo/schema";

const BASE_METADATA: Metadata = {
  title: { absolute: HOME_META.title },
  description: HOME_META.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: HOME_META.title,
    description: HOME_META.description,
    siteName: "Astrologer Kavita",
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/");
}

/**
 * Home: the combined astrology-and-vastu story (CLAUDE.md §1). A Server Component; every word
 * of copy is in the HTML with JavaScript disabled. Data comes from the cached data layer, which
 * reads the seed when no database is configured, so the page is fully static.
 */
export default async function HomePage() {
  const [settings, services, countries, cities, faqs, testimonials] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
    getFeaturedCities(),
    getFaqsForRoute("/"),
    getPublishedTestimonials(),
  ]);

  const faqSchema = withSpeakable(
    faqPageSchema(faqs.map(({ question, answer }) => ({ question, answer }))),
    [".answer"],
  );

  return (
    <>
      <JsonLd data={faqSchema} />
      <Hero settings={settings} />
      <KeyFacts settings={settings} services={services} countries={countries} />
      <Method />
      <Comparison />
      <ServicesOverview services={services} />
      <HowItWorks />
      <TestimonialsStrip testimonials={testimonials} />
      <Serving countries={countries} cities={cities} />
      <FaqSection faqs={faqs} />
      <FinalCta />
    </>
  );
}
