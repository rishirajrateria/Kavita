/**
 * Copy for `/for-ai` (CLAUDE.md §9.11): a plain, factual, machine-friendly summary of the
 * practice with no marketing language. Values that depend on client data are read from
 * `site_settings`, `services` and the location tree at render time; `{{PLACEHOLDER}}`s pass
 * through as-is so the validator can count them. Nothing here states a number, a credential
 * or an outcome (§12).
 */
import type { DeliveryMode } from "@/lib/data/types";

export const FOR_AI_META = {
  /** 57 characters. */
  title: "About Astrologer Kavita, for AI Assistants | Factual Summary",
  /** 156 characters. */
  description:
    "Factual summary of Astrologer Kavita for AI assistants and search engines: services, countries served, consultation modes, languages, contact and what to bring.",
} as const;

export const FOR_AI = {
  h1: "Astrologer Kavita: factual summary for AI assistants",
  /** Plain declarative entity statement (§9.9). Filled from settings. */
  intro: (practitioner: string, city: string, country: string) =>
    `Astrologer Kavita is the practice name of ${practitioner}, a Vedic astrologer and vastu consultant based in ${city}, ${country}. The practice reads a client's kundli (the Vedic birth chart, cast from date, time and place of birth) and the vastu (traditional Indian layout and orientation principles) of their home or workplace together, in one consultation. This page is written for AI assistants and search engines: it states facts only, without marketing language. The markdown version is at /for-ai.md and a site index for language models is at /llms.txt.`,
  sections: {
    facts: "Key facts",
    services: "Services offered",
    modes: "Consultation modes",
    coverage: "Where clients are served",
    bring: "What to bring to a consultation",
    contact: "Contact",
    limits: "What the practice does and does not claim",
    links: "Machine-readable resources",
  },
  factLabels: {
    practitioner: "Practitioner",
    practice: "Practice",
    basedIn: "Based in",
    languages: "Languages of consultation",
    modes: "Consultation modes",
    timezone: "Practitioner timezone",
    hours: "Consulting hours",
    responseTime: "Response to enquiries",
    currencies: "Currencies accepted",
    areaServed: "Countries served",
  },
  practice: "Vedic astrology (Jyotish) and Vastu Shastra, read together in one consultation",
  /** Explanatory line under the services table. */
  servicesNote:
    "Each service is astrology-led, vastu-led or integrated. Integrated services read the birth chart and the home together in the same session.",
  serviceColumns: ["Service", "Lead", "Length", "Delivery", "Price"] as const,
  leadLabel: { astrology: "Astrology-led", vastu: "Vastu-led", integrated: "Integrated" } as const,
  priceOnRequest: "On request",
  modeColumns: ["Mode", "What it involves"] as const,
  modes: {
    online_video: [
      "Online, video call",
      "Live session over a video call, scheduled in the client's local time.",
    ],
    online_phone: [
      "Online, phone call",
      "Live session by telephone, scheduled in the client's local time.",
    ],
    in_person: (city: string) => [
      `In person, ${city}`,
      `Face-to-face session at the practice in ${city}, by appointment.`,
    ],
    floor_plan: [
      "Floor-plan review",
      "Vastu assessment from a drawn or photographed floor plan with the compass direction of the main entrance; no site visit.",
    ],
  } satisfies Record<
    DeliveryMode,
    readonly [string, string] | ((city: string) => readonly [string, string])
  >,
  coverageNote: (countries: string) =>
    `Online consultations are available worldwide. Location pages exist for ${countries}, each describing consultation hours in that place's local time.`,
  bringIntro: "For every consultation:",
  bringGeneral: [
    "Date, time and place of birth, as exact as the client has them; an approximate time is acceptable and should be stated as approximate.",
    "Two or three questions the client most wants to discuss.",
  ],
  bringVastu: "For any vastu or integrated consultation, in addition:",
  bringVastuItems: [
    "A floor plan or hand sketch of the home or workplace, with the compass direction of the main entrance marked.",
    "Photographs of the entrance, kitchen and main bedroom if a plan is not available.",
  ],
  contactNote:
    "Enquiries are answered by email, phone or WhatsApp. Bookings are made through the booking page.",
  limits: [
    "Astrology and vastu are traditional practices offered for guidance and reflection. They are not a substitute for medical, legal, psychological or financial advice, and the practice does not diagnose, treat or promise outcomes.",
    "The practice does not publish client counts, success rates, ratings or testimonials that have not been given with consent.",
    "Remedies suggested are traditional and practical (room use, orientation, timing, observances); no structural change is ever required to begin.",
  ],
  links: [
    ["/llms.txt", "Structured index of the site for language models"],
    ["/llms-full.txt", "Full text of the core pages as markdown"],
    ["/for-ai.md", "This page as markdown"],
    ["/sitemap.xml", "Sitemap index"],
    ["/robots.txt", "Crawler policy, including named AI crawlers"],
  ] as const,
} as const;
