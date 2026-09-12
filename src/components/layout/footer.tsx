import Link from "next/link";
import type * as React from "react";
import { VastuCompass } from "@/components/motifs";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import {
  getCountries,
  getFeaturedCities,
  getServices,
  getSiteSettings,
  locationHref,
} from "@/lib/data";
import type { GeoService, Location } from "@/lib/data/types";
import { isPlaceholder, mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";
import { formatBusinessHours } from "./business-hours";
import { SocialLinks } from "./social-links";

const EXPLORE_LINKS = [
  { label: "Astrology", href: "/astrology" },
  { label: "Vastu", href: "/vastu" },
  { label: "About Kavita", href: "/about" },
  { label: "Learn", href: "/learn" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Book a consultation", href: "/book" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "For AI assistants", href: "/for-ai" },
  { label: "llms.txt", href: "/llms.txt" },
] as const;

const GEO_LABEL: Record<GeoService, string> = {
  astrologer: "Astrologer",
  "vastu-consultant": "Vastu consultant",
};

const linkClass =
  "inline-block py-0.5 text-sm text-muted-foreground no-underline transition-colors duration-(--duration-fast) ease-standard hover:text-accent-strong";

const headingClass =
  "font-serif text-[0.95rem] font-normal tracking-[0.14em] text-accent-strong uppercase";

/**
 * Site footer: the deepest pane on the page rather than an opaque slab. `data-tone="inverse"`
 * re-points every semantic token to the night palette in both themes, and the fill is
 * fill is painted from `--background`, which `data-depth="deep"` re-points to the deepest
 * indigo — the same contract as `Section tone="inverse"`. At 92% the band is genuinely deep in
 * both themes while the fixed <Sky /> still shows through it. One compass rose turns behind it.
 *
 * Server component; everything comes from site_settings, social_links, services and locations.
 * The NAP block is the one object here allowed to lift off the pane, so it is the only glass.
 * The two location lists flow in CSS columns instead of one tall stack — with ~17 links each
 * they were what made the old footer three screens deep with a dead column beside them.
 */
export async function Footer() {
  const [settings, services, countries, cities] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
    getFeaturedCities(),
  ]);

  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp);
  const mail = mailtoHref(settings.email);
  const hours = formatBusinessHours(settings.businessHours);
  const legalName = realValue(settings.legalEntity) ?? settings.brandName;
  const year = new Date().getFullYear();
  const cityLine = [settings.city, settings.country].filter((v) => v && !isPlaceholder(v));

  return (
    <Section
      as="footer"
      tone="inverse"
      depth="deep"
      spacing="none"
      className="isolate mt-auto overflow-hidden border-t border-accent-border/30"
    >
      {/* Ambient linework: one enormous, very slow compass rose anchored off the right edge. */}
      <VastuCompass
        decorative
        hideLabels
        strokeWidth={0.5}
        data-turn
        style={{ ["--turn-duration" as string]: "600s" }}
        className="pointer-events-none absolute -top-32 -right-40 -z-10 size-[34rem] text-accent-strong opacity-[0.05] sm:-right-32 lg:size-[42rem]"
      />

      <div className="mx-auto w-full max-w-wide px-gutter py-section-md">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-16">
          {/* NAP block ------------------------------------------------------------------- */}
          <div
            itemScope
            itemType="https://schema.org/ProfessionalService"
            className="flex flex-col gap-6"
          >
            <div>
              <p className="flex items-center gap-3 font-serif text-2xl font-normal tracking-[0.005em]">
                <VastuCompass
                  decorative
                  hideLabels
                  strokeWidth={1}
                  className="size-7 text-accent-strong/80"
                />
                <span itemProp="name">{settings.brandName}</span>
              </p>
              <p
                className="mt-3 max-w-[26rem] text-sm text-muted-foreground"
                itemProp="description"
              >
                {settings.tagline}
              </p>
            </div>

            <Card
              variant="solid"
              padding="sm"
              className="max-w-[26rem] border-accent-border/30 bg-card"
            >
              <address className="flex flex-col gap-2 text-sm not-italic">
                <ContactLine label="Phone">
                  {tel ? (
                    <a
                      href={tel}
                      itemProp="telephone"
                      className={linkClass}
                      data-event="call_clicked"
                    >
                      {settings.phone}
                    </a>
                  ) : (
                    <span itemProp="telephone">{settings.phone}</span>
                  )}
                </ContactLine>
                <ContactLine label="WhatsApp">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener"
                      className={linkClass}
                      data-event="whatsapp_clicked"
                    >
                      {settings.whatsapp}
                    </a>
                  ) : (
                    <span>{settings.whatsapp}</span>
                  )}
                </ContactLine>
                <ContactLine label="Email">
                  {mail ? (
                    <a href={mail} itemProp="email" className={linkClass}>
                      {settings.email}
                    </a>
                  ) : (
                    <span itemProp="email">{settings.email}</span>
                  )}
                </ContactLine>
                <span
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                  className="mt-2 border-t border-accent-border/25 pt-3 text-muted-foreground"
                >
                  {realValue(settings.addressLine1) ? (
                    <span itemProp="streetAddress" className="block">
                      {[settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  <span className="block">
                    <span itemProp="addressLocality">{settings.city}</span>
                    {settings.addressRegion ? (
                      <>
                        , <span itemProp="addressRegion">{settings.addressRegion}</span>
                      </>
                    ) : null}
                    , <span itemProp="addressCountry">{settings.country}</span>
                    {settings.addressPostalCode ? (
                      <>
                        {" "}
                        <span itemProp="postalCode">{settings.addressPostalCode}</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </address>

              {hours.length > 0 ? (
                <div className="mt-4 border-t border-accent-border/25 pt-3 text-sm">
                  <p className="font-medium">Consultation hours ({settings.timezone})</p>
                  <ul className="mt-1.5 text-muted-foreground">
                    {hours.map((line) => (
                      <li key={line.days}>
                        <span className="inline-block w-20">{line.days}</span>
                        <span>{line.hours}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-muted-foreground">
                    Online consultations worldwide
                    {settings.inPersonAvailable && cityLine.length
                      ? ` · In person in ${cityLine.join(", ")}`
                      : ""}
                    .
                  </p>
                </div>
              ) : null}
            </Card>

            <SocialLinks placement="footer" className="gap-2.5" />
          </div>

          {/* Navigation ------------------------------------------------------------------ */}
          <nav aria-label="Footer" className="contents">
            <FooterColumn title="Services">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.slug}`} className={linkClass}>
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className={linkClass}>
                  All services
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title="Explore">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </nav>
        </div>

        {/* By location — flowed in columns so ~34 links cost four rows, not two screens. --- */}
        <div className="mt-14 grid gap-10 border-t border-accent-border/25 pt-10 md:grid-cols-2 md:gap-12">
          <LocationColumn service="astrologer" countries={countries} cities={cities} />
          <LocationColumn service="vastu-consultant" countries={countries} cities={cities} />
        </div>

        {/* Legal ------------------------------------------------------------------------- */}
        <div className="mt-14 flex flex-col gap-5 border-t border-accent-border/25 pt-7 text-xs text-muted-foreground">
          <p className="max-w-prose leading-relaxed">
            Astrology and vastu are traditional practices offered for guidance and reflection. They
            are not a substitute for medical, legal or financial advice.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {legalName}. All rights reserved.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1 no-underline transition-colors duration-(--duration-fast) ease-standard hover:text-accent-strong"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/privacy#consent"
                  data-consent-manage
                  className="inline-block py-1 no-underline transition-colors duration-(--duration-fast) ease-standard hover:text-accent-strong"
                >
                  Manage consent
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ContactLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex gap-3">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      {children}
    </span>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className={headingClass}>{title}</p>
      <ul className="mt-5 flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function LocationColumn({
  service,
  countries,
  cities,
}: {
  service: GeoService;
  countries: Location[];
  cities: Location[];
}) {
  if (countries.length === 0 && cities.length === 0) return null;
  return (
    <div>
      <p className={headingClass}>{`${GEO_LABEL[service]} by location`}</p>
      <ul className="mt-5 columns-2 gap-x-8 sm:columns-3 md:columns-2 lg:columns-3">
        {[...countries, ...cities].map((c) => (
          <li key={c.path} className="break-inside-avoid">
            <Link href={locationHref(c, service)} className={linkClass}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
