import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FOR_AI, FOR_AI_META } from "@/content/for-ai";
import { HOME_PLACEHOLDERS } from "@/content/home";
import { getCountries, getServices, getSiteSettings } from "@/lib/data";
import type { DeliveryMode, Service, SiteSettings } from "@/lib/data/types";
import { openingHoursFromBusinessHours } from "@/lib/seo/schema";
import { mailtoHref, telHref, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: FOR_AI_META.title },
  description: FOR_AI_META.description,
  alternates: {
    canonical: "/for-ai",
    types: { "text/markdown": "/for-ai.md" },
  },
  openGraph: {
    type: "website",
    url: "/for-ai",
    title: FOR_AI_META.title,
    description: FOR_AI_META.description,
    siteName: "Astrologer Kavita",
  },
};

const CURRENCIES = "INR, USD, GBP, AED";

function priceLabel(s: Service): string {
  if (s.priceMinor !== null && s.currency) {
    return `${s.currency} ${(s.priceMinor / 100).toLocaleString("en-IN")}`;
  }
  return s.priceNote?.trim() || FOR_AI.priceOnRequest;
}

function modeRow(mode: DeliveryMode, settings: SiteSettings): readonly [string, string] {
  const entry = FOR_AI.modes[mode];
  if (typeof entry === "function") {
    const [label, detail] = entry(settings.city);
    return settings.inPersonAvailable
      ? [label, detail]
      : [label, `${detail} (${HOME_PLACEHOLDERS.inPerson})`];
  }
  return entry;
}

function modeSummary(modes: DeliveryMode[], settings: SiteSettings): string {
  return modes.map((m) => modeRow(m, settings)[0]).join("; ");
}

/** Deduplicated delivery modes across services, in schema order. */
function allModes(services: Service[]): DeliveryMode[] {
  const order: DeliveryMode[] = ["online_video", "online_phone", "in_person", "floor_plan"];
  const present = new Set(services.flatMap((s) => s.deliveryModes));
  return order.filter((m) => present.has(m));
}

function hoursLabel(settings: SiteSettings): string {
  const spec = openingHoursFromBusinessHours(settings.businessHours);
  return spec
    .map((s) => {
      const days = s.dayOfWeek.map((d) => d.replace("https://schema.org/", "").slice(0, 3));
      return `${days.join(", ")} ${s.opens}–${s.closes}`;
    })
    .join("; ");
}

const cell = "px-4 py-3 align-top leading-relaxed whitespace-normal";

/**
 * `/for-ai` (CLAUDE.md §9.11): plain facts for machines. Server Component; everything is in
 * the HTML. Values come from settings, services and the location tree; nothing is typed in.
 */
export default async function ForAiPage() {
  const [settings, services, countries] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getCountries(),
  ]);
  const modes = allModes(services);
  const countryNames = countries.map((c) => c.name).join(", ");

  const facts: readonly [string, string][] = [
    [FOR_AI.factLabels.practitioner, `${settings.practitionerName} (Astrologer Kavita)`],
    [FOR_AI.factLabels.practice, FOR_AI.practice],
    [FOR_AI.factLabels.basedIn, `${settings.city}, ${settings.country}`],
    [FOR_AI.factLabels.languages, HOME_PLACEHOLDERS.languages],
    [FOR_AI.factLabels.modes, modeSummary(modes, settings)],
    [FOR_AI.factLabels.timezone, settings.timezone],
    [FOR_AI.factLabels.hours, `${hoursLabel(settings)} (${settings.timezone})`],
    [FOR_AI.factLabels.responseTime, `Usually within ${settings.responseTimeHours} hours`],
    [FOR_AI.factLabels.currencies, CURRENCIES],
    [FOR_AI.factLabels.areaServed, countryNames],
  ];

  const tel = telHref(settings.phone);
  const wa = whatsappHref(settings.whatsapp);
  const mail = mailtoHref(settings.email);

  return (
    <>
      <Section spacing="sm" tone="muted" className="border-b border-accent-border/40">
        <Container size="wide">
          <Breadcrumbs items={[{ name: "For AI assistants", href: "/for-ai" }]} />
          <Heading
            as="h1"
            level={1}
            eyebrow="For AI assistants and search engines"
            className="mt-4"
          >
            {FOR_AI.h1}
          </Heading>
          <p className="answer mt-6 text-lg leading-relaxed">
            {FOR_AI.intro(settings.practitionerName, settings.city, settings.country)}
          </p>
        </Container>
      </Section>

      <Section spacing="md" aria-labelledby="facts-heading">
        <Container size="wide">
          <Heading as="h2" level={3} id="facts-heading">
            {FOR_AI.sections.facts}
          </Heading>
          <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-accent-border/30 bg-accent-border/30 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="bg-background px-4 py-4">
                <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                  {label}
                </dt>
                <dd className="mt-1.5 leading-snug text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section spacing="md" tone="muted" aria-labelledby="services-heading">
        <Container size="wide">
          <Heading as="h2" level={3} id="services-heading">
            {FOR_AI.sections.services}
          </Heading>
          <p className="mt-3 max-w-prose text-muted-foreground">{FOR_AI.servicesNote}</p>
          <Table containerClassName="mt-6 rounded-lg border bg-background" className="text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {FOR_AI.serviceColumns.map((c) => (
                  <TableHead key={c} scope="col" className={cell}>
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.slug} className="hover:bg-transparent">
                  <th scope="row" className={`${cell} text-left font-medium`}>
                    {s.name}
                  </th>
                  <TableCell className={cell}>{FOR_AI.leadLabel[s.lead]}</TableCell>
                  <TableCell className={cell}>{s.durationMinutes} min</TableCell>
                  <TableCell className={cell}>{modeSummary(s.deliveryModes, settings)}</TableCell>
                  <TableCell className={cell}>{priceLabel(s)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Container>
      </Section>

      <Section spacing="md" aria-labelledby="modes-heading">
        <Container size="wide">
          <Heading as="h2" level={3} id="modes-heading">
            {FOR_AI.sections.modes}
          </Heading>
          <Table containerClassName="mt-6 rounded-lg border" className="text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {FOR_AI.modeColumns.map((c) => (
                  <TableHead key={c} scope="col" className={cell}>
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modes.map((m) => {
                const [label, detail] = modeRow(m, settings);
                return (
                  <TableRow key={m} className="hover:bg-transparent">
                    <th scope="row" className={`${cell} text-left font-medium`}>
                      {label}
                    </th>
                    <TableCell className={cell}>{detail}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Heading as="h2" level={3} id="coverage-heading" className="mt-12">
            {FOR_AI.sections.coverage}
          </Heading>
          <p className="answer mt-3">{FOR_AI.coverageNote(countryNames)}</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {countries.map((c) => (
              <li key={c.path}>
                <Link href={`/astrologer/${c.path}`} className="underline underline-offset-4">
                  Astrologer in {c.name}
                </Link>
                {" · "}
                <Link href={`/vastu-consultant/${c.path}`} className="underline underline-offset-4">
                  Vastu consultant in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section spacing="md" tone="muted" aria-labelledby="bring-heading">
        <Container size="wide" className="grid gap-10 lg:grid-cols-2">
          <div>
            <Heading as="h2" level={3} id="bring-heading">
              {FOR_AI.sections.bring}
            </Heading>
            <p className="mt-3">{FOR_AI.bringIntro}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {FOR_AI.bringGeneral.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4">{FOR_AI.bringVastu}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {FOR_AI.bringVastuItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <Heading as="h2" level={3} id="contact-heading">
              {FOR_AI.sections.contact}
            </Heading>
            <p className="mt-3">{FOR_AI.contactNote}</p>
            <dl className="mt-4 space-y-2">
              <div>
                <dt className="inline font-medium">Email: </dt>
                <dd className="inline">
                  {mail ? <a href={mail}>{settings.email}</a> : settings.email}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Phone: </dt>
                <dd className="inline">
                  {tel ? <a href={tel}>{settings.phone}</a> : settings.phone}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">WhatsApp: </dt>
                <dd className="inline">
                  {wa ? (
                    <a href={wa} rel="noopener">
                      {settings.whatsapp}
                    </a>
                  ) : (
                    settings.whatsapp
                  )}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Booking: </dt>
                <dd className="inline">
                  <Link href="/book">/book</Link>
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </Section>

      <Section spacing="md" aria-labelledby="limits-heading">
        <Container size="wide" className="grid gap-10 lg:grid-cols-2">
          <div>
            <Heading as="h2" level={3} id="limits-heading">
              {FOR_AI.sections.limits}
            </Heading>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {FOR_AI.limits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <Heading as="h2" level={3} id="links-heading">
              {FOR_AI.sections.links}
            </Heading>
            <ul className="mt-3 space-y-2">
              {FOR_AI.links.map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="underline underline-offset-4">
                    {href}
                  </a>
                  {" — "}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </>
  );
}
