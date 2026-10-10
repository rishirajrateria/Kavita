import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import {
  Byline,
  CtaDisc,
  DoorField,
  FigureSection,
  Foot,
  MotifSprite,
  SceneHero,
  type Door,
} from "@/components/content";
import { ContactForm } from "@/components/forms/contact-form";
import { contactPointSchema } from "@/components/forms/contact-schema";
import { statusFromSearchParams } from "@/components/forms/form-status";
import { HoursFigure, NapBlock } from "@/components/forms/nap-block";
import { JsonLd } from "@/components/seo/json-ld";
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
import { cn } from "@/lib/utils";

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

/**
 * Contact, in the language of the home hero (SPEC §3): the practitioner's hours on a 24-hour
 * ring as the opening instrument, the real channels as a row of doors beneath it, the NAP on
 * the page's one glass plate, the form, the notes, the disc. Channels come from
 * `site_settings`; a map is embedded only with a real address. Every answer, every FAQ and
 * every link is in the served HTML.
 */
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
  const L = CONTACT_CHANNELS.labels;

  // The stations: only channels with a real destination become doors; the form is always one.
  const stations: Door[] = [];
  if (wa) {
    stations.push({
      href: wa,
      label: L.whatsapp,
      line: realValue(settings.whatsapp),
      motif: "ornament",
    });
  }
  if (tel) stations.push({ href: tel, label: "Call", line: channels.phoneText, motif: "ornament" });
  if (mail)
    stations.push({ href: mail, label: L.email, line: channels.emailText, motif: "ornament" });
  stations.push({
    href: "#form",
    label: CONTACT_FORM.eyebrow,
    line: "Send a message",
    motif: "ornament",
  });

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
      <MotifSprite />

      <SceneHero
        id="contact-hero"
        title={CONTACT_HERO.title}
        tagline={CONTACT_HERO.eyebrow}
        lede={CONTACT_HERO.lede}
        figure={<HoursFigure settings={settings} />}
        figureSize="half"
        figureRatio="1/1"
        breadcrumbs={[{ name: "Contact", href: "/contact" }]}
        actions={
          <DoorField
            doors={stations}
            variant="station"
            columns={2}
            className={cn(
              "w-full border-b border-border/60",
              stations.length > 1 ? "max-w-[40rem]" : "max-w-[18rem] grid-cols-1! text-left",
            )}
          />
        }
      />
      <Container size="wide">
        <Byline
          datePublished={CONTACT_DATES.published}
          dateModified={CONTACT_DATES.modified}
          withoutPhoto
        />
      </Container>

      <FigureSection
        route="/contact"
        id={CONTACT_CHANNELS.id}
        n="I"
        question={CONTACT_CHANNELS.question}
        answer={CONTACT_CHANNELS.answer}
        line={CONTACT_CHANNELS.eyebrow}
        figureWidth={mapQuery ? "wide" : "narrow"}
        figure={
          mapQuery ? (
            <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
              <NapBlock settings={settings} />
              <div className="overflow-hidden rounded-xl border border-accent-border/40">
                <iframe
                  title={`Map of ${settings.brandName}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full"
                />
              </div>
            </div>
          ) : (
            <NapBlock settings={settings} />
          )
        }
      />

      <FigureSection
        route="/contact"
        id="message"
        n="II"
        tone="muted"
        question={CONTACT_FORM.question}
        answer={CONTACT_FORM.answer}
      >
        <ContactForm channels={channels} initialStatus={statusFromSearchParams(sp)} />
      </FigureSection>

      <Foot
        route="/contact"
        eyebrow={CONTACT_FAQ.eyebrow}
        heading={CONTACT_FAQ.heading}
        answer={CONTACT_FAQ.answer}
        faqs={[...CONTACT_FAQ.items]}
      />

      <CtaDisc
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
