import Link from "next/link";
import type * as React from "react";
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
  "text-sm text-muted-foreground no-underline transition-colors hover:text-foreground hover:underline";

/** Site footer. Server component; everything comes from site_settings, social_links, services and locations. */
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
    <footer className="mt-auto border-t bg-surface-muted text-foreground">
      <div className="mx-auto w-full max-w-wide px-gutter py-section-sm">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* NAP block ------------------------------------------------------------------- */}
          <div
            itemScope
            itemType="https://schema.org/ProfessionalService"
            className="flex flex-col gap-4"
          >
            <div>
              <p className="font-serif text-xl font-medium tracking-tight" itemProp="name">
                {settings.brandName}
              </p>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground" itemProp="description">
                {settings.tagline}
              </p>
            </div>

            <address className="flex flex-col gap-1.5 text-sm not-italic">
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
              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
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
              <div className="text-sm">
                <p className="font-medium">Consultation hours ({settings.timezone})</p>
                <ul className="mt-1 text-muted-foreground">
                  {hours.map((line) => (
                    <li key={line.days}>
                      <span className="inline-block w-20">{line.days}</span>
                      <span>{line.hours}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-muted-foreground">
                  Online consultations worldwide
                  {settings.inPersonAvailable && cityLine.length
                    ? ` · In person in ${cityLine.join(", ")}`
                    : ""}
                  .
                </p>
              </div>
            ) : null}

            <SocialLinks placement="footer" className="-ml-2" />
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

            <div className="flex flex-col gap-6">
              <LocationColumn service="astrologer" countries={countries} cities={cities} />
              <LocationColumn service="vastu-consultant" countries={countries} cities={cities} />
            </div>
          </nav>
        </div>

        {/* Legal ------------------------------------------------------------------------- */}
        <div className="mt-10 flex flex-col gap-4 border-t pt-6 text-xs text-muted-foreground">
          <p className="max-w-prose">
            Astrology and vastu are traditional practices offered for guidance and reflection. They
            are not a substitute for medical, legal or financial advice.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {legalName}. All rights reserved.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="no-underline hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/privacy#consent"
                  data-consent-manage
                  className="no-underline hover:underline"
                >
                  Manage consent
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex gap-2">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      {children}
    </span>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-serif text-base font-medium">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">{children}</ul>
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
    <FooterColumn title={`${GEO_LABEL[service]} by location`}>
      {countries.map((c) => (
        <li key={c.id}>
          <Link href={locationHref(c, service)} className={linkClass}>
            {c.name}
          </Link>
        </li>
      ))}
      {cities.map((c) => (
        <li key={c.id}>
          <Link href={locationHref(c, service)} className={linkClass}>
            {c.name}
          </Link>
        </li>
      ))}
    </FooterColumn>
  );
}
