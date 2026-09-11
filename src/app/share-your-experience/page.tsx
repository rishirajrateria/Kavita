import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { Byline, PageHero, QuestionSection } from "@/components/content";
import { statusFromSearchParams } from "@/components/forms/form-status";
import { TestimonialForm } from "@/components/forms/testimonial-form";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  SHARE_DATES,
  SHARE_FORM,
  SHARE_HERO,
  SHARE_INTRO,
  SHARE_META,
} from "@/content/pages/testimonials";
import { getServices, getSiteSettings } from "@/lib/data";
import { mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";

const BASE_METADATA: Metadata = {
  title: { absolute: SHARE_META.title },
  description: SHARE_META.description,
  alternates: { canonical: "/share-your-experience" },
  robots: { index: false, follow: true },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/share-your-experience");
}

/** Client-experience intake. Copy is server-rendered; only the form itself is a client component. */
export default async function ShareYourExperiencePage({
  searchParams,
}: PageProps<"/share-your-experience">) {
  const sp = await searchParams;
  const [settings, services] = await Promise.all([getSiteSettings(), getServices()]);
  const channels = {
    whatsapp: whatsappHref(settings.whatsapp),
    email: mailtoHref(settings.email),
    tel: telHref(settings.phone),
    emailText: realValue(settings.email),
    phoneText: realValue(settings.phone),
  };

  return (
    <>
      <PageHero
        eyebrow={SHARE_HERO.eyebrow}
        title={SHARE_HERO.title}
        lede={SHARE_HERO.lede}
        motif="lines"
        breadcrumbs={[
          { name: "Client experiences", href: "/testimonials" },
          { name: "Share your experience", href: "/share-your-experience" },
        ]}
      />
      <Container size="wide">
        <Byline datePublished={SHARE_DATES.published} dateModified={SHARE_DATES.modified} />
      </Container>

      <QuestionSection
        route="/share-your-experience"
        id={SHARE_INTRO.id}
        eyebrow={SHARE_INTRO.eyebrow}
        question={SHARE_INTRO.question}
        answer={SHARE_INTRO.answer}
        spacing="md"
      />

      <Section id="share" spacing="lg" tone="muted" bordered>
        <Container size="default" className="space-y-8">
          <Heading as="h2" level={3} eyebrow="Form">
            {SHARE_FORM.heading}
          </Heading>
          <TestimonialForm
            services={services.map((s) => ({ slug: s.slug, name: s.name }))}
            channels={channels}
            initialStatus={statusFromSearchParams(sp)}
          />
        </Container>
      </Section>
    </>
  );
}
