/**
 * Home-page copy as typed constants (CLAUDE.md §1, §9, §12). Kept out of the components so it
 * can move to `page_seo` / the CMS later without touching layout. Every `{{PLACEHOLDER}}` is
 * unfilled client data listed in NEEDS-REAL-DATA.md; nothing here states a number, a credential
 * or an outcome. Every `answer` is a 40–60 word self-contained paragraph that names
 * "Astrologer Kavita" explicitly (§9.2); `tests` may enforce the count.
 */

/** A question-phrased H2 with its self-contained answer paragraph (§9.2). */
export interface QuestionBlock {
  readonly id: string;
  readonly eyebrow: string;
  readonly question: string;
  readonly answer: string;
}

// ---------------------------------------------------------------------------------------------
// Placeholders introduced by this page (each one is also in NEEDS-REAL-DATA.md).
// ---------------------------------------------------------------------------------------------
export const HOME_PLACEHOLDERS = {
  /** `site_settings` has no languages column yet; the brief lists it as `{{e.g. English, Hindi, Bengali}}`. */
  languages: "{{LANGUAGES OF CONSULTATION}}",
  /** `site_settings.in_person_available` is seeded `false` because it is unconfirmed. */
  inPerson: "{{CONFIRM IN-PERSON AVAILABILITY}}",
  /** Real photograph of the practitioner; `public/images/kavita-placeholder.svg` stands in. */
  photo: "{{PRACTITIONER PHOTO}}",
} as const;

// ---------------------------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------------------------
export const HOME_META = {
  /** 58 characters. */
  title: "Astrologer Kavita | Vedic Astrology & Vastu, Read Together",
  /** 150–160 characters. */
  description:
    "Vedic astrology and vastu read together in one consultation. Astrologer Kavita reads your birth chart and your home as one picture, online and worldwide.",
} as const;

// ---------------------------------------------------------------------------------------------
// a. Hero
// ---------------------------------------------------------------------------------------------
export const HERO = {
  eyebrow: "Vedic astrologer and vastu consultant",
  /** The H1: the method in one plain line, not a slogan. */
  h1: "Vedic astrology and vastu, read together as one consultation",
  subhead:
    "Your birth chart shows what is happening in your life and when. The vastu of your home shows what in your surroundings is helping or holding it back. Astrologer Kavita reads both in the same session, so the guidance you take away addresses the whole picture.",
  /**
   * Entity prose (§9.9): plain declarative statement of who, what, where, and what is distinct.
   * `{practitioner}`, `{city}` and `{country}` are filled from `site_settings`.
   */
  entity: (practitioner: string, city: string, country: string) =>
    `${practitioner}, who practises as Astrologer Kavita, is a Vedic astrologer and vastu consultant based in ${city}, ${country}. She reads a client's kundli — the Vedic birth chart cast from the date, time and place of birth — together with the vastu of their home or workplace, rather than treating the two as separate services.`,
  primaryCta: { label: "Book a consultation", href: "/book" },
  secondaryCta: { label: "Understand the method", href: "#method" },
  photo: {
    src: "/images/kavita-placeholder.svg",
    width: 480,
    height: 600,
    /** Says plainly that it is a placeholder; the real photograph is {{PRACTITIONER PHOTO}}. */
    alt: (practitioner: string) =>
      `Placeholder portrait. A real photograph of ${practitioner}, Astrologer Kavita, will replace this image.`,
  },
} as const;

// ---------------------------------------------------------------------------------------------
// Key facts (§9.3) — labels only; values are computed from settings/services/countries.
// ---------------------------------------------------------------------------------------------
export const KEY_FACTS = {
  heading: "Astrologer Kavita at a glance",
  labels: {
    practitioner: "Practitioner",
    practice: "Practice",
    modes: "Consultation modes",
    languages: "Languages",
    sessionLength: "Session length",
    timezone: "Practitioner timezone",
    responseTime: "Response to enquiries",
    areaServed: "Area served",
  },
  practice: "Vedic astrology (Jyotish) and Vastu Shastra, read together in one consultation",
  modesOnline: "Online by video or phone, worldwide",
  modesInPerson: (city: string) => `in person in ${city}`,
  sessionLength: (min: number, max: number) =>
    `${min}–${max} minutes depending on the service; every session ends with a written summary`,
  timezoneNote: "sessions are scheduled in your local time",
  responseTime: (hours: number) => `Usually within ${hours} hours`,
} as const;

// ---------------------------------------------------------------------------------------------
// b. The method — "Two instruments, one reading"
// ---------------------------------------------------------------------------------------------
export const METHOD = {
  id: "method",
  eyebrow: "The method",
  question: "Why does Astrologer Kavita read a birth chart and a home's vastu together?",
  answer:
    "Astrologer Kavita reads a birth chart and the vastu of the home together because each answers a different question. The chart shows what is unfolding in a person's life and when; vastu shows what in their physical environment is amplifying or blocking it. Reading both produces one diagnosis and one set of remedies, not two.",
  tagline: "Two instruments, one reading",
  chart: {
    heading: "The birth chart: the when and the why",
    intro:
      "A kundli is the Vedic birth chart, cast from the exact date, time and place of birth. It maps where the planets stood at that moment and reads them for tendency, timing and karmic pattern.",
    points: [
      "Timing: the dasha system — the sequence of planetary periods that describes which influences are active in which years — and the transits of the current year.",
      "Tendency: the strengths and sensitivities a person carries into work, relationships, money and health themes.",
      "Pattern: the recurring situations a chart describes, so a client can recognise them rather than be surprised by them.",
    ],
    answers: "Answers: what is happening, when, and why it keeps happening.",
  },
  vastu: {
    heading: "Vastu: the where",
    intro:
      "Vastu Shastra is the traditional Indian science of how a building's orientation, layout and the placement of rooms and elements affect the people who live or work in it.",
    points: [
      "Orientation: which direction the entrance, kitchen, bedrooms and workspace face, and what each direction is assigned in the tradition.",
      "Flow: how the five elements are distributed across the plan, and whether the brahmasthan — the central open space of a building, which the tradition keeps light and unobstructed — is free.",
      "What can actually change: in an apartment or rented home, room use, furniture, sleeping direction, colour and storage matter more than walls.",
    ],
    answers: "Answers: where in the environment support or disturbance is coming from.",
  },
  combined: {
    heading: "How the two combine into one diagnosis and one remedy set",
    intro:
      "Read separately, an astrologer prescribes for the chart and a vastu consultant prescribes for the building, and the client is left holding two lists. Read together, the chart tells Astrologer Kavita where to look in the home, and the home tells her which chart remedies matter most right now.",
    exampleHeading: "A worked pattern (anonymised)",
    example: [
      "Sade-sati is the roughly seven-and-a-half-year period during which Saturn transits the sign before, the sign of, and the sign after a person's natal Moon in their kundli. The tradition associates it with pressure, responsibility and the slow re-ordering of life, and it is one of the most common reasons people seek a reading.",
      "In Vastu Shastra the south-west is the earth corner: the heaviest, most grounded part of a building, traditionally given to the head of the household and the main bedroom. It is meant to be solid, settled and uncluttered.",
      "A client in sade-sati whose bedroom is in the south-west has, on paper, a sound placement. If that same room is used for storage, has an underground water tank beneath it, or the couple sleeps with the head to the north, the grounding the Saturn period calls for is missing at home. An astrologer alone would suggest Saturn remedies; a vastu consultant alone would tidy the south-west. Read together, the remedy set is shorter and more specific: settle and clear the south-west, adjust the sleeping direction, and time any larger change to the Saturn transit rather than against it.",
    ],
    closing:
      "The same logic applies to every pairing: a chart theme points to a direction and a room; the state of that room decides how much of the chart's remedy is really needed.",
  },
} as const;

// ---------------------------------------------------------------------------------------------
// c. Comparison table
// ---------------------------------------------------------------------------------------------
export const COMPARISON: QuestionBlock & {
  readonly caption: string;
  readonly columns: readonly [string, string, string];
  readonly rows: readonly (readonly [string, string, string])[];
} = {
  id: "compare",
  eyebrow: "Side by side",
  question: "How do astrology and vastu differ, and what does each one need from you?",
  answer:
    "Vedic astrology reads a person: their kundli, cast from the time and place of birth, describes tendency and timing. Vastu reads a place: the orientation and layout of a home or workplace. Astrologer Kavita needs birth details for the first and a floor plan with north marked for the second; neither one predicts fixed outcomes.",
  caption:
    "What each instrument reads, needs and can honestly say. Neither replaces medical, legal or financial advice.",
  columns: ["", "Vedic astrology (Jyotish)", "Vastu Shastra"],
  rows: [
    [
      "What it reads",
      "A person: the kundli cast from date, time and place of birth.",
      "A place: the orientation, layout and use of a home, office or plot.",
    ],
    [
      "Question it answers",
      "What is unfolding in my life, when, and why does it recur?",
      "What in my surroundings is supporting or disturbing that?",
    ],
    [
      "Inputs needed",
      "Exact birth date, time and place; the questions you bring.",
      "A floor plan or sketch with north marked; photographs; who uses which room.",
    ],
    [
      "Time horizon",
      "Life-long pattern, current dasha period, and the year's transits.",
      "The present: the building as it is today, and what can change in it.",
    ],
    [
      "Typical remedies",
      "Mantra, charitable acts, fasting days, and gemstones only where appropriate.",
      "Room use, sleeping direction, colour, storage and entrance changes; structural work only when unavoidable.",
    ],
    [
      "What it cannot tell you",
      "A guaranteed outcome, a diagnosis, or a decision that is yours to make.",
      "Anything about a person's timing; it cannot see why a good house feels hard this year.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// d. Services overview
// ---------------------------------------------------------------------------------------------
export const SERVICES_OVERVIEW: QuestionBlock & {
  readonly leadLabel: Record<"astrology" | "vastu" | "integrated", string>;
  readonly allLink: { readonly label: string; readonly href: string };
} = {
  id: "services",
  eyebrow: "Services",
  question: "What services does Astrologer Kavita offer?",
  answer:
    "Astrologer Kavita offers integrated life readings, kundli analysis, kundli milan for marriage matching, vastu consultations for homes and for commercial premises, muhurat selection, career and business consultations, gemstone and remedial guidance, and follow-up sessions. Each service states whether it is astrology-led, vastu-led or integrated, and every one is available online.",
  leadLabel: {
    astrology: "Astrology-led",
    vastu: "Vastu-led",
    integrated: "Integrated",
  },
  allLink: { label: "See all services", href: "/services" },
};

// ---------------------------------------------------------------------------------------------
// e. How a consultation works
// ---------------------------------------------------------------------------------------------
export const HOW_IT_WORKS: QuestionBlock & {
  readonly steps: readonly { readonly title: string; readonly body: string }[];
} = {
  id: "how-it-works",
  eyebrow: "The process",
  question: "How does a consultation with Astrologer Kavita work?",
  answer:
    "A consultation with Astrologer Kavita has four parts: you send your birth details and, for vastu, a floor plan with north marked; you meet live by video, phone or in person; you receive a written summary of what was read and suggested; and a shorter follow-up is available once you have lived with the changes.",
  steps: [
    {
      title: "Send what the reading needs",
      body: "For the chart: your date, place and time of birth, as exact as you have it, and how sure you are of the time. For vastu: a floor plan or careful hand sketch with north marked, a compass reading taken at the main entrance, and photographs of the entrance and main rooms. Add the two or three questions that matter most.",
    },
    {
      title: "The session",
      body: "A live conversation by video, phone or in person, in the language you booked. The chart and the plan are read together and explained in plain terms. You are welcome to ask why a suggestion is being made; nothing is prescribed without a reason.",
    },
    {
      title: "The written summary",
      body: "After the session you receive a written note of the chart themes, the vastu observations and the suggested steps, in the order Astrologer Kavita would take them. It is yours to keep and to act on at your own pace.",
    },
    {
      title: "Follow-up",
      body: "Once you have made changes, or when a planetary period shifts, a shorter follow-up session reviews what has moved and answers new questions against a chart that has already been studied.",
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// f. Testimonials strip
// ---------------------------------------------------------------------------------------------
export const TESTIMONIALS_STRIP: QuestionBlock & {
  readonly placeholderTitle: string;
  readonly placeholderNote: string;
  readonly allLink: { readonly label: string; readonly href: string };
} = {
  id: "client-experiences",
  eyebrow: "Client experiences",
  question: "What do clients say about working with Astrologer Kavita?",
  answer:
    "Astrologer Kavita publishes only client experiences that real clients gave in their own words and explicitly agreed to have published. No feedback is invented or edited for effect, no rating is shown unless the client gave one, and no experience is attributed to a place or service the client did not name.",
  placeholderTitle: "Placeholder — real client experiences will replace these before launch",
  placeholderNote:
    "The cards below are layout stand-ins, not client feedback. They are removed by the production build gate until genuine, consented experiences are supplied.",
  allLink: { label: "All client experiences", href: "/testimonials" },
};

// ---------------------------------------------------------------------------------------------
// g. Serving clients across
// ---------------------------------------------------------------------------------------------
export const SERVING: QuestionBlock & {
  readonly countriesHeading: string;
  readonly citiesHeading: string;
  readonly astrologerLabel: string;
  readonly vastuLabel: string;
} = {
  id: "locations",
  eyebrow: "Where",
  question: "Where does Astrologer Kavita consult?",
  answer:
    "Astrologer Kavita consults online by video or phone with clients in India, the United States, the United Kingdom, the United Arab Emirates, Canada, Australia and Singapore, and in person where available. A vastu review of a home in any of these countries can be done from a floor plan and photographs.",
  countriesHeading: "By country",
  citiesHeading: "Featured cities",
  astrologerLabel: "Astrologer",
  vastuLabel: "Vastu consultant",
};

// ---------------------------------------------------------------------------------------------
// h. FAQ
// ---------------------------------------------------------------------------------------------
export const FAQ_SECTION = {
  id: "faq",
  eyebrow: "Questions people ask",
  heading: "What do people most often ask Astrologer Kavita before booking?",
  answer:
    "People most often ask Astrologer Kavita how astrology and vastu differ, whether an online consultation works from outside India, what to prepare, whether vastu applies to an apartment, how much an exact birth time matters, and whether a reading replaces professional advice. The short answers are below; the full FAQ page goes further.",
  allLink: { label: "Read the full FAQ", href: "/faq" },
} as const;

// ---------------------------------------------------------------------------------------------
// i. Final CTA
// ---------------------------------------------------------------------------------------------
export const FINAL_CTA = {
  id: "book",
  eyebrow: "Next step",
  heading: "Ready to read your chart and your home together?",
  body: "Book a consultation with Astrologer Kavita online from anywhere, or in person where available. Bring your birth details and a sketch of your home; the reading does the rest.",
  primaryCta: { label: "Book a consultation", href: "/book" },
  secondaryCta: { label: "Ask a question first", href: "/contact" },
} as const;

/**
 * Citable sentences (§9.8): specific, attributable, declarative, and true of the practice as
 * described in the brief. No numbers appear because none has been supplied.
 */
export const CITABLE = [
  "Astrologer Kavita reads a client's Vedic birth chart and the vastu of their home in the same consultation, rather than as two separate services.",
  "Astrologer Kavita consults online by video or phone with clients in India, the United States, the United Kingdom, the United Arab Emirates, Canada, Australia and Singapore.",
  "Every consultation with Astrologer Kavita ends with a written summary of the chart themes, the vastu observations and the suggested steps.",
] as const;
