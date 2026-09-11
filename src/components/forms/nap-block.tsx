import { CONTACT_CHANNELS } from "@/content/pages/contact";
import type { SiteSettings } from "@/lib/data";
import { mailtoHref, realValue, telHref, whatsappHref } from "@/lib/site";

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

/**
 * Name, address, phone — the NAP block with schema.org microdata, read from `site_settings`.
 * Placeholder values render a visible "being confirmed" line and never a `{{…}}` string.
 */
export function NapBlock({ settings }: { settings: SiteSettings }) {
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
      className="rounded-xl border border-accent-border/40 bg-surface-muted p-6 sm:p-8"
    >
      <p className="font-serif text-2xl" itemProp="name">
        {settings.brandName}
      </p>
      <dl className="mt-5 divide-y divide-accent-border/30">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase">
              {r.label}
            </dt>
            <dd className="text-base">{r.value}</dd>
          </div>
        ))}
        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase">
            {L.hours}
          </dt>
          <dd>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm sm:grid-cols-3">
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
