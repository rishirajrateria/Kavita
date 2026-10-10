import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { Byline, FigureSection, SceneHero } from "@/components/content";
import { statusFromSearchParams } from "@/components/forms/form-status";
import { TestimonialForm } from "@/components/forms/testimonial-form";
import { AstronomicalLines } from "@/components/motifs";
import { EyebrowPlate } from "@/components/testimonials/eyebrow-plate";
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

const ROUTE = "/share-your-experience";

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

/**
 * Client-experience intake (SPEC §3): a small orbital figure as the scene, one ruled plate on
 * what happens next, then the form on the page's one glass plate. No foot and no disc — the
 * form is the action. Copy is server-rendered; only the form itself is a client component.
 */
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
      <SceneHero
        title={SHARE_HERO.title}
        tagline={SHARE_HERO.eyebrow}
        lede={SHARE_HERO.lede}
        figureSize="small"
        figureRatio="16/9"
        figure={<AstronomicalLines strokeWidth={0.9} className="text-accent-strong" />}
        breadcrumbs={[
          { name: "Client experiences", href: "/testimonials" },
          { name: "Share your experience", href: ROUTE },
        ]}
      />
      <Container size="wide">
        <Byline
          datePublished={SHARE_DATES.published}
          dateModified={SHARE_DATES.modified}
          withoutPhoto
        />
      </Container>

      <EyebrowPlate eyebrow={SHARE_INTRO.eyebrow}>
        <FigureSection
          route={ROUTE}
          id={SHARE_INTRO.id}
          n="I"
          className="pt-6!"
          question={SHARE_INTRO.question}
          answer={SHARE_INTRO.answer}
        />
      </EyebrowPlate>

      <Section id="share" spacing="lg" tone="muted" className="scroll-mt-20">
        <Container size="default">
          <div className="glass sheen mx-auto max-w-[48rem] rounded-2xl p-6 sm:p-10">
            <Heading
              as="h2"
              level={3}
              eyebrow="Form"
              className="font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-[1.1] font-normal"
            >
              {SHARE_FORM.heading}
            </Heading>
            <div className="mt-8">
              <TestimonialForm
                services={services.map((s) => ({ slug: s.slug, name: s.name }))}
                channels={channels}
                initialStatus={statusFromSearchParams(sp)}
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
