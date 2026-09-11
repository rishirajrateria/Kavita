/**
 * `/services` copy (CLAUDE.md §5, §9, §12). Every `answer` is a 40–60 word self-contained
 * paragraph naming "Astrologer Kavita". Nothing here states a price, a number or an outcome.
 */
import type { FaqItem } from "@/lib/seo/schema";

export const SERVICES_META = {
  /** 57 characters. */
  title: "Services | Astrology & Vastu Consultations Online",
  /** 150–160 characters. */
  description:
    "Every consultation Astrologer Kavita offers, each marked astrology-led, vastu-led or integrated: birth chart, kundli milan, home and commercial vastu, muhurat.",
} as const;

export const SERVICES_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const SERVICES_HERO = {
  eyebrow: "Services",
  title: "Consultations, each one part of a single method",
  lede: "Nine ways to work with Astrologer Kavita, from a full integrated reading of your chart and your home to a thirty-minute follow-up. Each page says whether the service is astrology-led, vastu-led or both, what to prepare, and what you receive.",
} as const;

export const SERVICES_INTRO = {
  id: "how-to-choose",
  eyebrow: "Choosing",
  question: "Which consultation with Astrologer Kavita should I book first?",
  answer:
    "For a first consultation, Astrologer Kavita recommends the Integrated Life Reading, which reads your kundli and the vastu of your home together in one session. Book a Kundli Analysis if you only want the chart, a home vastu consultation if you only want the home, and a follow-up only if you are an existing client.",
  body: [
    "The services below are one method with two instruments. Vedic astrology, or Jyotish, reads the kundli, the birth chart cast from your date, time and place of birth, for what is unfolding in your life and when. Vastu Shastra, the traditional Indian science of orientation and layout, reads your home or workplace for what in your surroundings is helping or holding that back.",
    "Each service is labelled by which instrument leads. An astrology-led service can be extended into the home later; a vastu-led one can be extended into the chart. The integrated services do both from the start.",
  ],
} as const;

export const LEAD_LABEL = {
  astrology: "Astrology-led",
  vastu: "Vastu-led",
  integrated: "Integrated",
} as const;

export const LEAD_DESCRIPTION = {
  astrology: "Reads your kundli; the home can be added later.",
  vastu: "Reads your home or workplace; the chart can be added later.",
  integrated: "Reads the chart and the space together from the start.",
} as const;

/** Extra columns for the comparison table that the service rows do not carry. */
export const COMPARISON_EXTRA: Readonly<
  Record<string, { readonly bestFor: string; readonly prepare: string }>
> = {
  "integrated-life-reading": {
    bestFor: "A first consultation, a move, or a stretch of years that feels harder than it should",
    prepare: "Birth details; floor plan with north marked; photographs; two or three questions",
  },
  "kundli-analysis": {
    bestFor: "Your own chart read on its own, or a second opinion on an earlier reading",
    prepare: "Birth date, time (and how sure you are) and place; your questions",
  },
  "kundli-milan": {
    bestFor: "Families and couples before an engagement or marriage",
    prepare: "Birth details for both people; any concern already raised",
  },
  "vastu-for-home": {
    bestFor: "A new house or flat, a choice between two, or a home that has felt unsettled",
    prepare: "Floor plan with north marked; photographs of entrance, kitchen, bedrooms",
  },
  "vastu-for-commercial": {
    bestFor: "Offices, shops, clinics, warehouses and factories, new or existing",
    prepare: "Site or floor plan with north; photographs; what the lease lets you change",
  },
  "muhurat-selection": {
    bestFor: "Fixing a date for a wedding, griha pravesh, launch or signing",
    prepare: "The event and city; your window of dates; birth details of the main people",
  },
  "career-and-business-consultation": {
    bestFor: "A job change, a stalled career, a launch, a partnership or succession",
    prepare: "Birth details; the decision in a few lines; optional workplace plan",
  },
  "gemstone-and-remedial-guidance": {
    bestFor: "Anyone advised to wear a stone or follow a remedy who wants a disinterested view",
    prepare: "Birth details; any remedies you already follow or were advised",
  },
  "follow-up-session": {
    bestFor: "Existing clients only: what has changed, and one new question",
    prepare: "Your previous written summary; what has changed since",
  },
};

export const SERVICES_COMPARISON = {
  id: "compare",
  eyebrow: "Compared",
  question: "How do Astrologer Kavita's consultation types compare?",
  answer:
    "Astrologer Kavita's consultations differ in which instrument leads, how long they run and what to prepare. Integrated readings need birth details and a floor plan; astrology-led readings need birth details only; vastu-led reviews need a plan and photographs. The table compares every service on those points so you can choose.",
  caption:
    "Every active consultation compared: which instrument leads, session length, who it suits and what to have ready. Prices are shown on each service page.",
  columns: ["Service", "Lead", "Duration", "Best for", "What to prepare"],
} as const;

export const SERVICES_LIST = {
  id: "all-services",
  eyebrow: "All services",
  question: "What services does Astrologer Kavita offer?",
  answer:
    "Astrologer Kavita offers nine consultations: an Integrated Life Reading, a Kundli Analysis, Kundli Milan for marriage matching, a home vastu consultation, commercial vastu for offices and factories, Muhurat Selection for auspicious dates, a Career and Business Consultation, Gemstone and Remedial Guidance, and a Follow-up Session for existing clients.",
} as const;

export const PRICE_LABELS = {
  onRequest: "Price on request",
  from: "From",
} as const;

export const SERVICES_FAQ = {
  eyebrow: "Questions",
  heading: "What do people ask before choosing a service?",
  answer:
    "Before choosing a service, people most often ask Astrologer Kavita whether to start with the chart or the home, whether every session is online, how the integrated reading differs from booking two separate ones, how prices work, and whether a follow-up can replace a full reading. The answers are below.",
  items: [
    {
      question: "Should I start with astrology or with vastu?",
      answer:
        "If you can only choose one, Astrologer Kavita suggests starting with whichever your question is really about: the chart for timing and disposition, the home for a space that feels wrong. If the question is about both, or you are unsure, the Integrated Life Reading reads them together and is the usual starting point.",
    },
    {
      question: "Are all of Astrologer Kavita's services available online?",
      answer:
        "Yes. Every service Astrologer Kavita offers runs by video or phone, in your own time zone, for clients in India and abroad. Vastu reviews are done from a floor plan and photographs. In-person sessions are offered where she is available, which is stated on the contact page.",
    },
    {
      question:
        "Is the Integrated Life Reading the same as booking a chart reading and a home review separately?",
      answer:
        "No. In the Integrated Life Reading Astrologer Kavita reads the chart and the home against each other in one sitting, so the guidance addresses how the two interact. Two separate sessions each give a fuller treatment of their own half but leave the joining to you.",
    },
    {
      question: "How are prices set and in which currencies?",
      answer:
        "Each service page shows its price when one has been published, in Indian rupees with equivalents in US dollars, pounds sterling and UAE dirhams. Where a price is not yet listed it is available on request. Astrologer Kavita states the fee before a session is confirmed; there are no add-ons.",
    },
    {
      question: "Can I book a follow-up instead of a full reading?",
      answer:
        "Only if Astrologer Kavita has already read your chart or reviewed your home. The follow-up is priced and timed as a short return visit for existing clients. A new client, or a client with a new home or a long gap since the last reading, should book a full service.",
    },
  ] satisfies FaqItem[],
} as const;

export const SERVICES_CTA = {
  title: "Not sure which one fits?",
  body: "Send a few lines about your situation and Astrologer Kavita will suggest the right service and confirm the fee before anything is booked.",
  primaryHref: "/book",
  primaryLabel: "Book a consultation",
  secondaryHref: "/contact",
  secondaryLabel: "Ask first",
} as const;

/** Shared copy for `/services/[slug]`. */
export const SERVICE_PAGE = {
  keyFactsHeading: (name: string) => `${name} at a glance`,
  labels: {
    service: "Service",
    lead: "Approach",
    duration: "Session length",
    modes: "Consultation modes",
    languages: "Languages",
    timezone: "Practitioner time zone",
    responseTime: "Response to enquiries",
    price: "Price",
  },
  modeLabel: {
    online_video: "online by video",
    online_phone: "by phone",
    in_person: "in person where available",
    floor_plan: "from a floor plan and photographs",
  },
  timezoneNote: "sessions scheduled in your local time",
  responseTime: (hours: number) => `Usually within ${hours} hours`,
  prepareTable: {
    caption: "Inputs for the two halves of an integrated reading.",
    columns: ["For the chart (astrology)", "For the space (vastu)"],
  },
  related: {
    eyebrow: "Related",
    heading: "Which services are often booked with this one?",
  },
  faq: {
    eyebrow: "Questions",
    heading: (name: string) => `What do people ask about the ${name}?`,
  },
  cta: {
    title: (name: string) => `Ready to book the ${name}?`,
    body: "Choose a time that suits your time zone and send the details listed above. Astrologer Kavita confirms the fee before the session.",
    primaryLabel: "Book this service",
    secondaryHref: "/contact",
    secondaryLabel: "Ask a question first",
  },
} as const;
