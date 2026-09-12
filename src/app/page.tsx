import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { Hero, Instruments, Practitioner, Questions, Timing } from "@/components/home";
import { JsonLd } from "@/components/seo/json-ld";
import { HOME_META } from "@/content/home";
import { getFaqsForRoute, getSiteSettings } from "@/lib/data";
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
 * Home: the chart is the door (CLAUDE.md §4). Pictures first, one line under each; the kundli in
 * the middle is the navigation. A Server Component — every word, every house link and every
 * answer block is in the HTML with JavaScript disabled. Data comes from the cached data layer,
 * which reads the seed when no database is configured, so the page is fully static.
 */
export default async function HomePage() {
  const [settings, faqs] = await Promise.all([getSiteSettings(), getFaqsForRoute("/")]);

  const faqSchema = withSpeakable(
    faqPageSchema(faqs.map(({ question, answer }) => ({ question, answer }))),
    [".answer"],
  );

  return (
    <>
      <JsonLd data={faqSchema} />
      <Hero settings={settings} />
      <Instruments />
      <Timing />
      <Practitioner settings={settings} />
      <Questions faqs={faqs} />
    </>
  );
}
