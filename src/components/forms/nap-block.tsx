import type * as React from "react";
import { Rule } from "@/components/content";
import { Clocks } from "@/components/motifs";
import { CONTACT_CHANNELS } from "@/content/pages/contact";
import type { SiteSettings } from "@/lib/data";
import { computeConsultationWindowFor, practitionerDay } from "@/lib/data/consultation-window";
import { mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Static list of business hours for the NAP block. */
export function hoursLines(settings: SiteSettings): { day: string; hours: string }[] {
  const names = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return (Object.keys(names) as (keyof typeof names)[]).map((d) => {
    const v = settings.businessHours[d];
    return {
      day: names[d],
      hours: v && v.length ? v.map((i) => `${i.open}–${i.close}`).join(", ") : "Closed",
    };
  });
}

const DT = "font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-accent-strong uppercase";
const DD = "font-serif text-[1.1rem] leading-snug text-foreground";

/**
 * Name, address, phone — the NAP block with schema.org microdata, read from `site_settings`,
 * set as the page's one glass plate in the `KeyFacts` voice (SPEC §2.3): Karla caps labels,
 * Cormorant values, hairline rows, the sheen crossing it last of the three plates on the site.
 * Placeholder values render a visible "being confirmed" line and never a `{{…}}` string.
 */
export function NapBlock({ settings, className }: { settings: SiteSettings; className?: string }) {
  const L = CONTACT_CHANNELS.labels;
  const phone = realValue(settings.phone);
  const wa = whatsappHref(settings.whatsapp);
  const mail = mailtoHref(settings.email);
  const email = realValue(settings.email);
  const tel = telHref(settings.phone);
  const city = realValue(settings.city);
  const country = realValue(settings.country);
  const street = [realValue(settings.addressLine1), realValue(settings.addressLine2)]
    .filter(Boolean)
    .join(", ");
  const pending = (
    <span className="text-muted-foreground" data-placeholder="contact">
      {CONTACT_CHANNELS.pending}
    </span>
  );
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: L.whatsapp,
      value: wa ? (
        <a href={wa} rel="noopener" className="text-accent-strong">
          {realValue(settings.whatsapp)}
        </a>
      ) : (
        pending
      ),
    },
    {
      label: L.phone,
      value:
        tel && phone ? (
          <a href={tel} itemProp="telephone" className="text-accent-strong">
            {phone}
          </a>
        ) : (
          pending
        ),
    },
    {
      label: L.email,
      value:
        mail && email ? (
          <a href={mail} itemProp="email" className="text-accent-strong">
            {email}
          </a>
        ) : (
          pending
        ),
    },
    {
      label: L.inPerson,
      value:
        settings.inPersonAvailable && city
          ? CONTACT_CHANNELS.inPersonYes(city)
          : CONTACT_CHANNELS.inPersonNo,
    },
    {
      label: L.timezone,
      value: <span itemProp="areaServed">{settings.timezone}</span>,
    },
    {
      label: L.responseTime,
      value: CONTACT_CHANNELS.responseTime(settings.responseTimeHours),
    },
  ];
  if (street || city || country) {
    rows.splice(3, 0, {
      label: L.address,
      value: (
        <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
          {street ? <span itemProp="streetAddress">{street}, </span> : null}
          {city ? <span itemProp="addressLocality">{city}</span> : null}
          {city && country ? ", " : null}
          {country ? <span itemProp="addressCountry">{country}</span> : null}
        </span>
      ),
    });
  }

  return (
    <div
      itemScope
      itemType="https://schema.org/ProfessionalService"
      className={cn("glass sheen w-full p-7 sm:p-9", className)}
      style={{ ["--sheen-delay" as string]: "9s" }}
    >
      <p
        className="flex items-center gap-4 font-display text-[0.72rem] font-semibold tracking-[0.22em] text-accent-strong uppercase after:h-px after:flex-1 after:bg-accent-border/40"
        itemProp="name"
      >
        {settings.brandName}
      </p>
      <dl className="mt-2 grid gap-x-10 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="border-t border-accent-border/25 py-4">
            <dt className={DT}>{r.label}</dt>
            <dd className={cn(DD, "mt-2")}>{r.value}</dd>
          </div>
        ))}
        <div className="border-t border-accent-border/25 py-4 sm:col-span-2">
          <dt className={DT}>{L.hours}</dt>
          <dd className="mt-2">
            <ul className="grid gap-x-8 gap-y-1 font-serif text-base sm:grid-cols-2">
              {hoursLines(settings).map((h) => (
                <li key={h.day} className="flex justify-between gap-2 tabular-nums">
                  <span className="text-muted-foreground">{h.day}</span>
                  <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  );
}

const toMinutes = (hhmm: string): number => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * The practitioner's hours on a 24-hour ring (SPEC §2.3 `Clocks`) — and the visitor's local
 * ring beside it when a place is known — with the windows and zone names in HTML beneath,
 * never inside the SVG. The lit arc is dashed, and the figure captioned "Hours to be confirmed
 * by the practitioner", whenever `site_settings` carries no working hours and the consultation
 * window is computed from the assumed default instead.
 */
export function HoursFigure({
  settings,
  local,
  now = new Date(),
  className,
}: {
  settings: SiteSettings;
  /** A resolved location: its ring is drawn beside the practitioner's. */
  local?: { name: string; timezone: string };
  now?: Date;
  className?: string;
}) {
  const day = practitionerDay(settings.businessHours);
  const win = computeConsultationWindowFor(
    { timezone: local?.timezone ?? settings.timezone },
    settings,
    now,
  );
  const localRing =
    local && win.localStart && win.localEnd
      ? {
          openMinutes: toMinutes(win.localStart),
          closeMinutes: toMinutes(win.localEnd),
          label: `${local.name} (${local.timezone})`,
        }
      : undefined;

  return (
    <div
      className={cn(
        "grid h-full w-full grid-rows-[minmax(0,1fr)_auto] justify-items-center",
        className,
      )}
    >
      <Clocks
        practitioner={{
          openMinutes: day.open,
          closeMinutes: day.close,
          label: `${settings.brandName} (${settings.timezone})`,
        }}
        local={localRing}
        assumed={day.assumed}
        className="h-full w-auto max-w-full"
      />
      <div className="mt-2 text-center">
        <Rule tone="muted" as="p" className="justify-center">
          {day.assumed
            ? "Hours to be confirmed by the practitioner"
            : CONTACT_CHANNELS.labels.hours}
        </Rule>
        <p className="mt-3 font-serif text-[1.15rem] leading-snug text-foreground">
          {win.practitionerWindow}
          <span className="text-muted-foreground"> · {settings.timezone}</span>
        </p>
        {local ? (
          <p className="mt-1 font-serif text-[1.15rem] leading-snug text-foreground">
            {win.localWindow}
            <span className="text-muted-foreground"> · {local.name}</span>
          </p>
        ) : null}
        {win.note ? (
          <p className="mx-auto mt-2 max-w-[36rem] font-sans text-[0.8rem] text-muted-foreground">
            {win.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
