/**
 * `/about` copy as typed constants — the site's E-E-A-T anchor (CLAUDE.md §8 E-E-A-T, §9.9,
 * §12). The first paragraph is plain declarative entity prose. Every credential, year and count
 * is a `{{PLACEHOLDER}}` from `src/content/practitioner.ts` (listed in NEEDS-REAL-DATA.md §10);
 * nothing here promises an outcome. Every `answer` is a 40–60 word self-contained paragraph
 * naming "Astrologer Kavita" (§9.2).
 */
import type { FaqItem } from "@/lib/seo/schema";

export const ABOUT_META = {
  /** 57 characters. */
  title: "About Astrologer Kavita | Vedic Astrologer & Vastu Expert",
  /** 150–160 characters. */
  description:
    "Who Astrologer Kavita is, how she trained, how she reads a kundli and a home's vastu as one method, and what she does not claim to do. Online worldwide.",
} as const;

export const ABOUT_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const ABOUT_HERO = {
  eyebrow: "About · Vedic astrologer and vastu consultant",
  h1: "About Astrologer Kavita",
  /**
   * The first paragraph on the page (§9.9): who, what, where, what is distinct — declarative,
   * no marketing language. `name`, `city` and `country` come from `site_settings`.
   */
  lede: (name: string, city: string, country: string, inPerson: boolean) =>
    `${name}, who practises as Astrologer Kavita, is a Vedic astrologer and vastu consultant based in ${city}, ${country}. She reads a client's kundli — the Vedic birth chart cast from the date, time and place of birth — together with the vastu of their home or workplace, as one integrated consultation rather than two separate services. She consults online worldwide by video and phone${inPerson ? `, and in person in ${city}.` : `. In-person sessions in ${city}: {{CONFIRM IN-PERSON AVAILABILITY}}.`}`,
  entity:
    "Most practitioners offer astrology or vastu. Astrologer Kavita's method treats them as one discipline with two instruments: the chart says what is happening and when; the home says what in the environment is helping or holding it back.",
  primaryCta: { label: "Book a consultation", href: "/book" },
  secondaryCta: { label: "See the services", href: "/services" },
} as const;

export interface AboutSection {
  readonly id: string;
  readonly eyebrow: string;
  readonly question: string;
  readonly answer: string;
  readonly paragraphs?: readonly string[];
  readonly list?: readonly string[];
  readonly steps?: readonly { readonly title: string; readonly body: string }[];
  readonly closing?: string;
}

export const ABOUT_TOC_LABELS = {
  training: "Training",
  experience: "Experience",
  method: "Method",
  session: "A session",
  limits: "What it can tell you",
  "not-claimed": "What she does not claim",
  languages: "Languages",
  where: "Where",
  faq: "FAQ",
} as const;

// ---------------------------------------------------------------------------------------------
// Training and lineage — the credentials `<dl>` is rendered from `PRACTITIONER.credentials`.
// ---------------------------------------------------------------------------------------------
export const ABOUT_TRAINING: AboutSection = {
  id: "training",
  eyebrow: "Training and lineage",
  question: "How was Astrologer Kavita trained in Vedic astrology and vastu?",
  answer:
    "Astrologer Kavita trained formally in Jyotish, the Vedic system of astrology, and separately in vastu shastra, the traditional Indian science of building and layout. Her qualifications, the institutions she studied at and the lineage she learned within are listed below exactly as she has supplied them; nothing is added to that list.",
  paragraphs: [
    "Jyotish — literally “the science of light” — is the astrological system of the Indian tradition. It is learned as a discipline with its own texts, calculation methods and interpretive rules, and it takes years of study before a practitioner reads charts for others. Vastu shastra is a separate body of knowledge concerned with the orientation, proportion and use of buildings. A consultant who reads both must have been trained in both.",
    "The list below is the practitioner's own record of that training. Where a line still shows a placeholder, the detail has not yet been supplied, and the site says so rather than filling the gap.",
  ],
  closing:
    "Astrologer Kavita does not list awards, memberships or press mentions unless they are real and verifiable; the structured data on this page carries the same rule.",
};

export const ABOUT_TRAINING_LABELS = {
  listHeading: "Qualifications and training, as supplied by the practitioner",
  pending: "Awaiting the practitioner's record",
} as const;

// ---------------------------------------------------------------------------------------------
// Years of practice — placeholders only; only real numbers may ever replace them (§12).
// ---------------------------------------------------------------------------------------------
export const ABOUT_EXPERIENCE: AboutSection = {
  id: "experience",
  eyebrow: "Years of practice",
  question: "How long has Astrologer Kavita been practising?",
  answer:
    "Astrologer Kavita has been practising Vedic astrology and vastu for {{YEARS}} years, beginning in {{YEAR}}. The figures on this page are supplied by the practitioner herself and are updated only when they change; the site does not estimate or round them, because a number quoted back to a client has to be one she can stand behind.",
  paragraphs: [
    "Since {{YEAR}} she has completed {{N}} integrated astrology-and-vastu consultations, roughly {{X}} per cent of them for clients living outside India — in the United States, the United Kingdom, the Gulf, Canada, Australia and Singapore — most of them online.",
    "Experience in this field is not a matter of volume alone. It is the accumulation of charts and floor plans read together, and of seeing how a pattern in a chart tends to show itself in a particular corner of a home. That pairing — a chart theme with a direction and a room — is the material of her practice.",
  ],
};

// ---------------------------------------------------------------------------------------------
// Methodology
// ---------------------------------------------------------------------------------------------
export const ABOUT_METHOD: AboutSection = {
  id: "method",
  eyebrow: "Method",
  question: "How does Astrologer Kavita read a birth chart and a home together?",
  answer:
    "Astrologer Kavita starts with the kundli — the Vedic birth chart — to establish what is unfolding in a client's life and when, then reads the vastu of the home for what in the environment is amplifying or blocking it. The chart tells her where to look in the home; the home tells her which chart remedies matter most.",
  steps: [
    {
      title: "Cast and verify the chart",
      body: "The kundli is cast from the date, exact time and place of birth. If the birth time is uncertain, she says so and works with the parts of the chart that do not depend on it, rather than guessing a lagna (the rising sign, which changes roughly every two hours).",
    },
    {
      title: "Read the dasha and the current transits",
      body: "The dasha — the sequence of planetary periods in Vedic astrology that says which influences are active in which years — is read alongside this year's transits. This is what gives the reading its timing: not only what a chart tends towards, but which of those tendencies is live now.",
    },
    {
      title: "Identify the two or three themes that matter",
      body: "A chart contains far more than any one session can cover. She narrows the reading to the themes the client has brought and the ones the dasha makes current, so the guidance is specific rather than a tour of every house.",
    },
    {
      title: "Map those themes onto the home",
      body: "Each chart theme points to a direction and a room in vastu shastra. She reads the floor plan and photographs for those areas first — the entrance, the south-west, the north-east, the kitchen, the bedroom — and checks whether the brahmasthan, the open centre of the plan, is free.",
    },
    {
      title: "Give one list of steps, not two",
      body: "The remedies from the chart and the corrections from the home are combined into a single, ordered set, with the non-structural changes first: room use, sleeping direction, colour, storage, timing. Structural work is suggested only when nothing else answers.",
    },
    {
      title: "Write it down",
      body: "Every consultation ends with a written summary of the chart themes, the vastu observations and the suggested steps, so the client has something to return to rather than a memory of a conversation.",
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// What a session involves
// ---------------------------------------------------------------------------------------------
export const ABOUT_SESSION: AboutSection = {
  id: "session",
  eyebrow: "What a session involves",
  question: "What happens in a consultation with Astrologer Kavita?",
  answer:
    "A consultation with Astrologer Kavita is a live conversation by video or phone, prepared in advance from the birth details and, for vastu, a floor plan with north marked and photographs. She presents what the chart and the home show, discusses the questions the client has brought, and follows up with a written summary.",
  paragraphs: [
    "Before the session, the client sends the date, time and place of birth for each person to be read, a floor plan or hand sketch of the home with the direction of the main entrance, a few photographs, and the two or three questions they most want to discuss. She prepares the chart and reviews the plan before the call, so the session itself is spent on interpretation rather than data entry.",
    "During the session she walks through the chart's main themes and their timing, then the home, then how the two connect for the questions raised. Clients are welcome to interrupt, ask for definitions and disagree; a reading is a dialogue, not a pronouncement.",
    "After the session, the written summary arrives with the observations and the suggested steps. Follow-up sessions exist for clients who want to review what changed or ask about a new period.",
  ],
};

// ---------------------------------------------------------------------------------------------
// What astrology and vastu can and cannot tell you
// ---------------------------------------------------------------------------------------------
export const ABOUT_LIMITS: AboutSection = {
  id: "limits",
  eyebrow: "Her view of the practice",
  question: "What can astrology and vastu tell you, and what can they not?",
  answer:
    "In Astrologer Kavita's view, Vedic astrology describes tendency and timing — the themes a person is likely to meet and when they are most active — and vastu describes how a building supports or disturbs those themes. Neither predicts a fixed outcome, replaces a professional's advice, or takes a decision that belongs to the client.",
  paragraphs: [
    "Both are traditional Indian sciences with long textual histories, and both are offered here as guidance and reflection. A chart can show that a period is demanding, and where the pressure is likely to fall; it cannot say what a person will choose to do in it. A floor plan can show that a bedroom sits in a corner the tradition associates with restlessness; it cannot diagnose why someone is not sleeping.",
    "What the two do well, and especially together, is give a person a vocabulary for what they are living through and a set of practical, mostly small adjustments — in timing, in the use of rooms, in daily practice — that the tradition holds to be supportive. What they cannot do is guarantee anything, and a practitioner who says otherwise is not practising the tradition honestly.",
  ],
};

export const ABOUT_NOT_CLAIMED: AboutSection = {
  id: "not-claimed",
  eyebrow: "Plainly stated",
  question: "What does Astrologer Kavita not claim to do?",
  answer:
    "Astrologer Kavita does not predict medical, legal or financial outcomes, does not guarantee results from any reading or remedy, and does not use fear to sell corrections or gemstones. Astrology and vastu are offered as traditional guidance for reflection and planning, not as a substitute for the advice of a doctor, lawyer or financial adviser.",
  list: [
    "She does not diagnose, treat or predict the course of any medical condition, pregnancy or fertility, and will refer a client to a doctor rather than to a remedy.",
    "She does not advise on the outcome of legal matters, investments, property purchases or business deals, and does not present a reading as a reason to act against professional advice.",
    "She does not guarantee results — a marriage, a job, a visa, a sale — from any reading, muhurat or vastu correction.",
    "She does not prescribe fear-based remedies and does not tell clients that harm will follow if a correction or purchase is not made; where a gemstone is discussed it is one option among several, never a condition of the reading.",
    "She does not recommend demolition or major structural work when a non-structural change would serve, and she says plainly when a building simply cannot be made to fit the tradition.",
  ],
  closing:
    "The full statement of what the practice is and is not, including how personal data such as birth details and floor plans is handled, is on the disclaimer and privacy pages linked in the footer.",
};

// ---------------------------------------------------------------------------------------------
// Languages and where she consults
// ---------------------------------------------------------------------------------------------
export const ABOUT_LANGUAGES: AboutSection = {
  id: "languages",
  eyebrow: "Languages",
  question: "Which languages does Astrologer Kavita consult in?",
  answer:
    "Astrologer Kavita consults in {{LANGUAGES OF CONSULTATION}}. Sessions are held in whichever of these the client is most comfortable in, and the written summary that follows every consultation is in the same language, so that Sanskrit terms such as kundli, dasha and brahmasthan are explained in words the client will actually reuse.",
  paragraphs: [
    "Every Sanskrit or Vedic term used in a session is defined the first time it comes up. Clients who grew up with the vocabulary and clients meeting it for the first time are read the same way; the difference is only in how much is explained.",
  ],
};

export const ABOUT_WHERE: AboutSection = {
  id: "where",
  eyebrow: "Where she consults",
  question: "Where does Astrologer Kavita consult?",
  answer:
    "Astrologer Kavita consults online by video or phone with clients anywhere in the world, scheduled in the client's own time zone; in-person sessions in {{CITY}} are {{CONFIRM IN-PERSON AVAILABILITY}}. She serves clients in India, the United States, the United Kingdom, the United Arab Emirates, Canada, Australia and Singapore, and reads vastu remotely from a floor plan and photographs.",
  paragraphs: [
    "A remote vastu reading needs the same inputs as a visit — a plan with north marked, a compass reading at the entrance and photographs of each room — and for an apartment or a rented home it is usually the practical choice, since the changes that are available are in use, furniture and direction rather than in walls. On-site visits are arranged where they genuinely add something and the distance allows.",
  ],
};

export const ABOUT_WHERE_LINKS = {
  heading: "Astrology and vastu by country",
  astrologerLabel: "Astrologer",
  vastuLabel: "Vastu consultant",
} as const;

// ---------------------------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------------------------
export const ABOUT_FAQ = {
  eyebrow: "Questions about the practitioner",
  heading: "What do people ask about Astrologer Kavita before they book?",
  answer:
    "Before booking, people most often ask Astrologer Kavita whether she is a real, named practitioner, whether a reading can be done entirely online, what she needs from them, and whether astrology and vastu can be read separately. The short answers: yes, yes, birth details and a floor plan, and yes — though she recommends the integrated reading.",
  items: [
    {
      question: "Is Astrologer Kavita a real person, and is Kavita her name?",
      answer:
        "Yes. Astrologer Kavita is the practice name of {{FULL_NAME}}, a Vedic astrologer and vastu consultant based in {{CITY}}, {{COUNTRY}}. Her name, contact details and location are the same on this site, on her Google Business Profile and on every social profile linked in the footer.",
    },
    {
      question: "Can I have a consultation with Astrologer Kavita entirely online?",
      answer:
        "Yes. Most consultations are by video or phone, scheduled in your own time zone. Vastu is read remotely from a floor plan with north marked, a compass reading taken at the entrance and photographs of each room, which is enough for a full reading of an apartment or house.",
    },
    {
      question: "Do I have to book astrology and vastu together?",
      answer:
        "No. Kundli analysis, kundli milan, muhurat selection and vastu consultations are all available on their own. Astrologer Kavita recommends the integrated reading because the chart and the home explain each other, but a single-instrument session is a complete consultation in itself.",
    },
    {
      question: "What does Astrologer Kavita need before a first reading?",
      answer:
        "The date, exact time and place of birth of each person to be read; for vastu, a floor plan or hand sketch with the direction of the main entrance and photographs; and the two or three questions you most want to discuss. If your birth time is uncertain, say so — she will tell you what can and cannot be read.",
    },
    {
      question: "Will Astrologer Kavita tell me something frightening?",
      answer:
        "No. A reading names difficult periods honestly, but as periods with a shape and an end, and always with practical steps. She does not use fear to prompt purchases or corrections, does not predict illness or death, and will say when a question is better taken to a doctor, lawyer or financial adviser.",
    },
  ] satisfies FaqItem[],
} as const;

export const ABOUT_CTA = {
  eyebrow: "Next step",
  title: "Would you like your chart and your home read together?",
  body: "Book an integrated reading, or start with a single question by message. Every session ends with a written summary you can return to.",
  primary: { label: "Book a consultation", href: "/book" },
  secondary: { label: "Ask a question first", href: "/contact" },
} as const;
