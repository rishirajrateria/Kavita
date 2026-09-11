import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { Byline, CtaBand, FaqBlock, PageHero, QuestionSection } from "@/components/content";
import { ContactForm } from "@/components/forms/contact-form";
import { contactPointSchema } from "@/components/forms/contact-schema";
import { statusFromSearchParams } from "@/components/forms/form-status";
import { NapBlock } from "@/components/forms/nap-block";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  CONTACT_CHANNELS,
  CONTACT_CTA,
  CONTACT_DATES,
  CONTACT_FAQ,
  CONTACT_FORM,
  CONTACT_HERO,
  CONTACT_META,
} from "@/content/pages/contact";
import { PRACTITIONER } from "@/content/practitioner";
import { getCountries, getSiteSettings } from "@/lib/data";
import { postalAddressFromSettings } from "@/lib/seo/schema";
import { getSiteUrl, mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";

const BASE_METADATA: Metadata = {
  title: { absolute: CONTACT_META.title },
  description: CONTACT_META.description,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    title: CONTACT_META.title,
    description: CONTACT_META.description,
  },
};

/** Static metadata plus any admin override from `page_seo` (Phase 6). */
export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA, "/contact");
}

/** Contact: channels from `site_settings`, NAP with microdata, form, map only with a real address. */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const [settings, countries] = await Promise.all([getSiteSettings(), getCountries()]);
  const wa = whatsappHref(settings.whatsapp);
  const mail = mailtoHref(settings.email);
  const tel = telHref(settings.phone);
  const channels = {
    whatsapp: wa,
    email: mail,
    tel,
    emailText: realValue(settings.email),
    phoneText: realValue(settings.phone),
  };
  const address = postalAddressFromSettings(settings);
  const mapQuery = address?.streetAddress
    ? [address.streetAddress, address.addressLocality, address.postalCode, address.addressCountry]
        .filter(Boolean)
        .join(", ")
    : null;
  const languages = realValue(PRACTITIONER.languages)?.split(/,\s*/);

  return (
    <>
      <JsonLd
        data={contactPointSchema({
          settings,
          siteUrl: getSiteUrl(),
          languages,
          areaServed: countries.map((c) => c.name),
        })}
      />
      <PageHero
        eyebrow={CONTACT_HERO.eyebrow}
        title={CONTACT_HERO.title}
        lede={CONTACT_HERO.lede}
        motif="compass"
        breadcrumbs={[{ name: "Contact", href: "/contact" }]}
        actions={
          <>
            {wa ? (
              <Button asChild variant="gold" size="xl">
                <a href={wa} rel="noopener">
                  WhatsApp
                </a>
              </Button>
            ) : null}
            {tel ? (
              <Button asChild variant="gold-outline" size="xl">
                <a href={tel}>Call</a>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="xl">
              <a href="#form">Send a message</a>
            </Button>
          </>
        }
      />
      <Container size="wide">
        <Byline datePublished={CONTACT_DATES.published} dateModified={CONTACT_DATES.modified} />
      </Container>

      <QuestionSection
        id={CONTACT_CHANNELS.id}
        eyebrow={CONTACT_CHANNELS.eyebrow}
        question={CONTACT_CHANNELS.question}
        answer={CONTACT_CHANNELS.answer}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <NapBlock settings={settings} />
          {mapQuery ? (
            <div className="overflow-hidden rounded-xl border border-accent-border/40">
              <iframe
                title={`Map of ${settings.brandName}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full"
              />
            </div>
          ) : null}
        </div>
      </QuestionSection>

      <QuestionSection
        id="message"
        eyebrow={CONTACT_FORM.eyebrow}
        question={CONTACT_FORM.question}
        answer={CONTACT_FORM.answer}
        tone="muted"
      >
        <div className="max-w-[44rem]">
          <ContactForm channels={channels} initialStatus={statusFromSearchParams(sp)} />
        </div>
      </QuestionSection>

      <FaqBlock
        route="/contact"
        heading={CONTACT_FAQ.heading}
        answer={CONTACT_FAQ.answer}
        eyebrow={CONTACT_FAQ.eyebrow}
        items={[...CONTACT_FAQ.items]}
      />

      <CtaBand
        title={CONTACT_CTA.title}
        body={CONTACT_CTA.body}
        primaryHref={CONTACT_CTA.primaryHref}
        primaryLabel={CONTACT_CTA.primaryLabel}
        secondaryHref={CONTACT_CTA.secondaryHref}
        secondaryLabel={CONTACT_CTA.secondaryLabel}
        motif="compass"
      />
    </>
  );
}
