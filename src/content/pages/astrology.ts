/**
 * `/astrology` hub copy — optimised for astrology intent (CLAUDE.md §5, §8, §9). Typed
 * constants only; no numbers about the practice, no outcomes, every Sanskrit term defined on
 * first use. Every `answer` is a 40–60 word self-contained paragraph naming "Astrologer Kavita".
 * Facts about the tradition (the Vimshottari periods, sidereal vs tropical, chart styles) are
 * textbook Jyotish, not claims about the practitioner.
 */
import type { FaqItem } from "@/lib/seo/schema";

export const ASTROLOGY_META = {
  /** 59 characters. */
  title: "Vedic Astrology (Jyotish) Consultations | Astrologer Kavita",
  /** 150–160 characters. */
  description:
    "What Vedic astrology is, what a kundli contains, how dashas give timing, what to prepare, and how Astrologer Kavita adds the vastu of your home to the reading.",
} as const;

export const ASTROLOGY_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const ASTROLOGY_HERO = {
  eyebrow: "Vedic astrology · Jyotish",
  h1: "Vedic astrology, read together with the vastu of your home",
  lede: "Vedic astrology — Jyotish — reads the kundli, the birth chart cast from your date, time and place of birth, for what is unfolding in your life and when. Astrologer Kavita reads it with one difference: the vastu of your home is part of the same picture, so the guidance addresses where you live as well as what your chart says.",
  entity:
    "Every reading is by video or phone, in your own time zone, with a written summary afterwards. Kundli, dasha, lagna and the other terms used on this page are each explained where they first appear.",
  primaryCta: { label: "Book an astrology reading", href: "/book" },
  secondaryCta: { label: "Vastu, the other instrument", href: "/vastu" },
} as const;

export const ASTROLOGY_KEY_FACTS = {
  heading: "Vedic astrology with Astrologer Kavita at a glance",
  labels: {
    service: "Service",
    practitioner: "Practitioner",
    system: "System",
    inputs: "Inputs needed",
    modes: "Consultation modes",
    languages: "Languages",
    sessionLength: "Session length",
    timezone: "Practitioner time zone",
    responseTime: "Response to enquiries",
  },
  service: "Vedic astrology (Jyotish) readings, with the home's vastu read alongside",
  system:
    "Sidereal zodiac, Vimshottari dasha timing, North or South Indian chart style as preferred",
  inputs: "Date, exact time and place of birth; your questions; a floor plan if vastu is included",
  modesOnline: "Online by video or phone, worldwide",
  modesInPerson: (city: string) => `in person in ${city}`,
  sessionLength: (min: number, max: number) =>
    `${min}–${max} minutes depending on the service, with a written summary`,
  timezoneNote: "sessions are scheduled in your local time",
  responseTime: (hours: number) => `Usually within ${hours} hours`,
} as const;

export interface HubSection {
  readonly id: string;
  readonly eyebrow: string;
  readonly question: string;
  readonly answer: string;
  readonly paragraphs?: readonly string[];
  readonly closing?: string;
}

export interface HubTable {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export const ASTROLOGY_TOC = [
  { id: "what-is-vedic-astrology", text: "Vedic vs Western" },
  { id: "kundli", text: "The kundli" },
  { id: "dashas", text: "Dashas and timing" },
  { id: "what-it-answers", text: "What it answers" },
  { id: "prepare", text: "What to prepare" },
  { id: "process", text: "The reading" },
  { id: "chart-styles", text: "Chart styles" },
  { id: "with-vastu", text: "Adding vastu" },
  { id: "services", text: "Services" },
  { id: "where", text: "Where" },
  { id: "faq", text: "FAQ" },
] as const;

// ---------------------------------------------------------------------------------------------
// 1. What Vedic astrology is, and how it differs from Western astrology
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_WHAT: HubSection = {
  id: "what-is-vedic-astrology",
  eyebrow: "Jyotish",
  question: "What is Vedic astrology, and how does it differ from Western astrology?",
  answer:
    "Vedic astrology, or Jyotish, is the astrological system of the Indian tradition. It uses the sidereal zodiac, fixed to the stars, gives the Moon and its nakshatra (lunar mansion) central weight, and times events with dashas — planetary periods. Astrologer Kavita practises Jyotish; Western astrology uses the tropical zodiac, tied to the seasons, and times events by transits and progressions.",
  paragraphs: [
    "The two systems share the same planets and the same twelve signs, and they share a starting point: the sky as it stood at the moment of birth. They part company on where the zodiac begins. Western astrology's tropical zodiac starts at the spring equinox, so it moves slowly against the fixed stars; Jyotish's sidereal zodiac stays aligned with the stars. The difference between the two, called the ayanamsa, is currently a little under twenty-four degrees, which is why a person's Sun sign in a Vedic chart is often the sign before their Western one.",
    "The more practical difference is method. Jyotish is built for timing. It reads the Moon's nakshatra at birth to start a sequence of planetary periods — the dasha — and it reads the ascendant sign, the lagna, as the frame for the whole chart. That is why an exact birth time matters more in Jyotish than in most Western work: the lagna changes roughly every two hours.",
  ],
};

export const ASTROLOGY_VS_WESTERN: HubTable = {
  caption:
    "How the two systems differ on the points that change a reading. Both read the same sky; the zodiac, the timing tools and the emphasis are what differ.",
  columns: ["", "Vedic astrology (Jyotish)", "Western astrology"],
  rows: [
    [
      "Zodiac",
      "Sidereal: fixed to the stars. Signs stay where the constellations are.",
      "Tropical: fixed to the seasons. Aries begins at the spring equinox.",
    ],
    [
      "Ayanamsa",
      "The offset between the two zodiacs, applied to every position; the Lahiri (Chitrapaksha) value is the most widely used in India.",
      "Not used; positions are tropical by definition.",
    ],
    [
      "Central point of the chart",
      "The lagna — the sign rising on the eastern horizon at birth — and the Moon's sign (rashi) and nakshatra.",
      "The Sun sign in popular use; the ascendant and full chart in serious work.",
    ],
    [
      "House system",
      "Whole-sign houses are traditional (each sign is one house from the lagna); a bhava chalit chart refines cusps for some purposes.",
      "Many systems in use — Placidus, Koch, Equal, Whole Sign — chosen by the astrologer.",
    ],
    [
      "Timing tools",
      "Dashas — planetary periods, most commonly Vimshottari — read alongside gochar, the current transits.",
      "Transits, secondary progressions, solar arcs and solar returns.",
    ],
    [
      "Planets used",
      "The seven visible bodies plus Rahu and Ketu, the lunar nodes; the outer planets are not part of classical Jyotish.",
      "The seven classical bodies plus Uranus, Neptune and Pluto; the nodes are used by some.",
    ],
    [
      "Divisional charts",
      "Vargas — charts derived by dividing each sign — such as the navamsa (ninth division) for marriage and the dashamsa (tenth) for career.",
      "Not used; harmonics play a related but less central role.",
    ],
    [
      "Chart drawing",
      "A square — the North Indian diamond or the South Indian grid — read anticlockwise or clockwise respectively.",
      "A circular wheel with the ascendant on the left, read anticlockwise.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// 2. What a kundli contains
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_KUNDLI: HubSection = {
  id: "kundli",
  eyebrow: "The birth chart",
  question: "What does a kundli (Vedic birth chart) contain?",
  answer:
    "A kundli is the Vedic birth chart: a square diagram of the sky at the moment and place of birth. It records the lagna (rising sign), the rashi (Moon sign), the birth nakshatra, the nine grahas (planets) in their signs and the twelve bhavas (houses). Astrologer Kavita reads these together with the dasha sequence they generate.",
  paragraphs: [
    "Each element answers a different question. The lagna frames the whole life — temperament, health, the person's own agency. The rashi and nakshatra describe the mind and the emotional weather, and the nakshatra also starts the dasha clock. The grahas are the actors; the bhavas are the areas of life they act in. Divisional charts such as the navamsa add detail to a particular area, and the dasha says which actor has the stage now.",
    "A kundli cast from an exact time is a precise document. The same chart cast from a rounded birth time may have the wrong lagna — and with it, every house shifts by one. This is why the reading begins by checking the birth time.",
  ],
};

export const ASTROLOGY_KUNDLI_TABLE: HubTable = {
  caption:
    "The elements of a kundli and what each one is read for. Sanskrit terms are the ones you will hear in a consultation.",
  columns: ["Element", "What it is", "What it shows in a reading"],
  rows: [
    [
      "Lagna (ascendant)",
      "The sign rising on the eastern horizon at the moment of birth; it changes roughly every two hours.",
      "The frame of the chart: constitution, temperament, how the person meets life. Every house is counted from it.",
    ],
    [
      "Rashi (Moon sign)",
      "The sign the Moon occupied at birth; it changes about every two and a quarter days.",
      "The mind and emotional life. In India a person's “sign” usually means the Moon sign, not the Sun sign.",
    ],
    [
      "Nakshatra",
      "One of twenty-seven lunar mansions, each spanning 13°20′ of the zodiac, in which the Moon stood at birth.",
      "A finer description of temperament than the sign alone, and the starting point of the Vimshottari dasha.",
    ],
    [
      "Grahas (planets)",
      "Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, and the lunar nodes Rahu and Ketu — nine in all.",
      "The forces at work: each graha governs certain themes and acts in the house and sign it occupies.",
    ],
    [
      "Bhavas (houses)",
      "Twelve divisions of the chart counted from the lagna — self, wealth, siblings, home, children and so on.",
      "The areas of life. A graha's house says where its themes play out; the house's lord says how that area fares.",
    ],
    [
      "Yogas",
      "Named combinations of grahas and houses described in the classical texts.",
      "Recurring patterns — of support or strain — that a trained reader recognises rather than reconstructs each time.",
    ],
    [
      "Vargas (divisional charts)",
      "Charts derived by dividing each sign into parts: the navamsa (ninths), the dashamsa (tenths) and others.",
      "Depth on one area — the navamsa for marriage and the inner life, the dashamsa for career — and a check on the main chart's promises.",
    ],
    [
      "Dasha",
      "The sequence of planetary periods that runs from the birth nakshatra through the whole life.",
      "Timing: which graha's themes are active in which years, and within them, which months.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// 3. Dashas and timing
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_DASHAS: HubSection = {
  id: "dashas",
  eyebrow: "Timing",
  question: "What are dashas, and why does timing matter in Vedic astrology?",
  answer:
    "Dashas are the planetary periods of Vedic astrology: a fixed sequence in which each graha in turn colours a stretch of years. The most used system, Vimshottari, runs a 120-year cycle of nine periods starting from the Moon's nakshatra at birth. Astrologer Kavita reads the running dasha to say which of a chart's themes are active now.",
  paragraphs: [
    "Vimshottari — the name means “one hundred and twenty” — assigns each graha a period of fixed length: Ketu seven years, Venus twenty, Sun six, Moon ten, Mars seven, Rahu eighteen, Jupiter sixteen, Saturn nineteen and Mercury seventeen. The sequence always runs in that order; where a person enters it, and how far into the first period, is set by the Moon's exact position in its nakshatra at birth. Each major period (mahadasha) is subdivided into sub-periods (antardasha, also called bhukti) in the same proportions, which is what lets a reading speak in months as well as years.",
    "This is why two people with similar charts can be living very different years: one is in a Jupiter period, the other in Saturn's. And it is why a good chart can feel hard for a while and a difficult one can have an easy decade. The dasha does not change what the chart promises; it says when each promise is due. Transits — gochar, the planets' current positions against the birth chart — are read on top of the dasha, and sade-sati, Saturn's roughly seven-and-a-half-year passage over the natal Moon, is the best known of them.",
  ],
};

// ---------------------------------------------------------------------------------------------
// 4. What it can and cannot answer
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_ANSWERS: HubSection = {
  id: "what-it-answers",
  eyebrow: "Honest scope",
  question: "Which questions can Vedic astrology genuinely answer, and which can it not?",
  answer:
    "Vedic astrology can describe the themes a person tends to meet, the periods in which each is most active, and the areas of life under pressure or support in a given year. It cannot predict a fixed outcome, diagnose illness, or make a decision for you. Astrologer Kavita states this scope at the start of every reading.",
  paragraphs: [
    "The questions it answers well are the ones about pattern and timing. The ones it answers badly are the ones that ask for certainty about a single event, or that belong to another profession entirely. Anyone who has been told by an astrologer exactly what will happen on a given date has been told more than the tradition supports.",
  ],
};

export const ASTROLOGY_CAN = {
  heading: "Questions Jyotish is built to answer",
  items: [
    "What are the recurring themes of my life, and why do certain situations keep returning?",
    "Which period am I in now, what does it tend to bring, and when does it change?",
    "Is this a supportive year for a career move, a relocation, a marriage, a new venture — and if not now, when is better?",
    "How compatible are two charts, and where will a couple need to make the most effort? (Kundli milan.)",
    "Which dates in a given window are supportive for a particular undertaking? (Muhurat.)",
    "What practices does the tradition suggest for the period I am in?",
  ],
} as const;

export const ASTROLOGY_CANNOT = {
  heading: "Questions it cannot honestly answer",
  items: [
    "Will I definitely get this job, this visa, this house, this person? A chart shows support or strain, never certainty.",
    "What illness do I have, or will I have? That is a doctor's question; a chart can at most suggest a period to take care in.",
    "Should I sign this contract, make this investment, pursue this case? A chart informs timing; the decision, and the professional advice, are yours to take.",
    "When exactly will something happen? Jyotish speaks in periods — years and months — not in days, and any astrologer who names the day is guessing.",
    "Can a remedy guarantee a result? No remedy in the tradition guarantees anything; remedies are supportive practices, not transactions.",
  ],
} as const;

// ---------------------------------------------------------------------------------------------
// 5. What to prepare
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_PREPARE: HubSection = {
  id: "prepare",
  eyebrow: "Before the reading",
  question: "What do you need to prepare for a Vedic astrology reading?",
  answer:
    "For a Vedic astrology reading with Astrologer Kavita you need your date of birth, your time of birth as exactly as you have it, and the town of birth. The time matters because the lagna, the rising sign that frames the chart, changes roughly every two hours. Bring two or three questions, and a floor plan if vastu is included.",
  paragraphs: [
    "The birth time is the input most people are least sure of, and the one that matters most. A birth certificate or hospital record is best; a parent's memory is next; “around noon” is usable with limits. If the time is uncertain, say so — the reading will lean on the Moon's position, which moves slowly, and on the dasha, rather than on house placements that depend on the lagna. Astrologer Kavita will tell you which parts of the chart she is confident in and which she is not.",
    "The place of birth sets the local time and the horizon. The town is enough; the hospital is not needed. For a kundli milan both people's details are required, and for a muhurat, the window of dates you have in mind.",
  ],
};

export const ASTROLOGY_PREPARE_LIST = {
  heading: "Bring to the session",
  items: [
    "Date of birth — day, month and year.",
    "Time of birth, as precise as the record allows, and where the record came from.",
    "Place of birth — town or city and country.",
    "For kundli milan: the same three details for both people.",
    "For a muhurat: the undertaking and the window of dates that is practical for you.",
    "Two or three questions you most want to discuss, in your own words.",
    "If vastu is included: a floor plan or hand sketch with north marked, and photographs of each room.",
  ],
} as const;

// ---------------------------------------------------------------------------------------------
// 6. The reading process
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_PROCESS: HubSection = {
  id: "process",
  eyebrow: "The reading",
  question: "How does a Vedic astrology reading with Astrologer Kavita work?",
  answer:
    "A Vedic astrology reading with Astrologer Kavita is prepared in advance from your birth details and delivered live by video or phone in your own time zone. She presents the chart's main themes, the running dasha and this year's transits, discusses your questions, and follows up with a written summary of what was read and what was suggested.",
};

export const ASTROLOGY_STEPS = [
  {
    title: "Send your details",
    body: "Birth date, time and place, and your questions, through the booking form. Nothing is read from a message thread; everything is kept in one place and handled under the privacy policy.",
  },
  {
    title: "The chart is cast and checked",
    body: "Before the call the kundli and its divisional charts are cast, the birth time is sanity-checked against known life events where possible, and the running dasha is calculated.",
  },
  {
    title: "The live session",
    body: "The main themes first, then the timing, then your questions. Terms are defined as they come up; you are welcome to stop and ask.",
  },
  {
    title: "The home, if included",
    body: "In an integrated reading the floor plan is read next, for the rooms and directions the chart has pointed to, and the two are brought together into one set of observations.",
  },
  {
    title: "The written summary",
    body: "After the session: the themes, the periods, the suggested practices and, where included, the vastu steps — in the language of the session, so you can return to it.",
  },
] as const;

// ---------------------------------------------------------------------------------------------
// 7. North vs South Indian chart style
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_CHART_STYLES: HubSection = {
  id: "chart-styles",
  eyebrow: "Two drawings of one chart",
  question: "What is the difference between the North Indian and South Indian chart styles?",
  answer:
    "The North Indian and South Indian chart styles are two ways of drawing the same kundli. The North Indian diamond keeps the houses fixed and moves the signs; the South Indian grid keeps the signs fixed and marks the lagna. Astrologer Kavita reads both and draws your chart in whichever style your family is used to.",
  paragraphs: [
    "Neither style is more accurate; the positions are identical. The choice matters only for reading fluency — a client from Chennai will usually recognise the grid and a client from Delhi the diamond — and for comparing a new chart with an older one drawn by a family astrologer. A third style, the East Indian, is used in Bengal and Odisha and combines elements of both.",
  ],
};

export const ASTROLOGY_CHART_STYLE_TABLE: HubTable = {
  caption:
    "Same chart, two drawings. Ask for whichever you read most easily; the interpretation does not change.",
  columns: ["", "North Indian style", "South Indian style"],
  rows: [
    [
      "Shape",
      "A square divided by its diagonals and an inner diamond into twelve triangles and rhombi.",
      "A four-by-four grid of squares with the centre four left empty — twelve cells around the edge.",
    ],
    [
      "What stays fixed",
      "The houses. The top-centre diamond is always the first house (the lagna); house numbers never move.",
      "The signs. Aries is always the second cell of the top row, and the twelve signs run clockwise from it.",
    ],
    [
      "What moves",
      "The signs: a number in each house shows which sign occupies it for this chart.",
      "The lagna: a diagonal line or the letters “La” mark the cell whose sign is rising.",
    ],
    [
      "Reading direction",
      "Anticlockwise from the top-centre house.",
      "Clockwise from the lagna cell.",
    ],
    [
      "Where it is common",
      "North, west and central India — Delhi, Punjab, Uttar Pradesh, Rajasthan, Gujarat, Maharashtra — and the diaspora from those regions.",
      "South India — Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana — and the diaspora from those regions.",
    ],
    [
      "Strength",
      "House relationships are seen at a glance — what is opposite, what is in the angles.",
      "Sign-based patterns and transits are easy to follow because every sign has its permanent place.",
    ],
  ],
};

export const ASTROLOGY_CHART_MOTIFS = {
  north: {
    title: "North Indian style birth chart",
    description:
      "A square divided into twelve houses by its diagonals and an inner diamond; the first house is the top-centre diamond.",
  },
  south: {
    title: "South Indian style birth chart",
    description:
      "A four-by-four grid with the centre left empty; the twelve signs occupy the outer cells in a fixed clockwise order.",
  },
} as const;

// ---------------------------------------------------------------------------------------------
// 8. How vastu is added
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_WITH_VASTU: HubSection = {
  id: "with-vastu",
  eyebrow: "The other instrument",
  question: "How is the vastu of your home added to an astrology reading?",
  answer:
    "After the chart, Astrologer Kavita reads the vastu of the home — the orientation and use of its rooms — for the directions the chart's themes point to. Vastu shastra assigns each direction a quality; a chart theme under pressure is checked against its room. The result is one shorter, more specific list of steps rather than two.",
  paragraphs: [
    "A worked pattern makes the point. Sade-sati is the roughly seven-and-a-half-year period during which Saturn transits the sign before, the sign of, and the sign after the natal Moon. The tradition associates it with pressure, responsibility and the slow re-ordering of life, and it is one of the most common reasons people book a reading.",
    "In vastu shastra the south-west is the earth corner: the heaviest, most settled part of a building, traditionally given to the head of the household and the main bedroom. Read from the chart alone, a client in sade-sati would be given Saturn's practices. Read together, the first question is where that client sleeps. A south-west bedroom used as storage, a bed with its head to the north, an underground tank beneath the room — each removes the grounding the period calls for. The combined remedy is shorter: settle and clear the south-west, adjust the sleeping direction, and time any larger change to the transit rather than against it.",
  ],
  closing:
    "The same logic applies to every pairing: a chart theme points to a direction and a room; the state of that room decides how much of the chart's remedy is really needed.",
};

// ---------------------------------------------------------------------------------------------
// 9. Services and 10. geo
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_SERVICES: HubSection = {
  id: "services",
  eyebrow: "Services",
  question: "Which astrology services does Astrologer Kavita offer?",
  answer:
    "Astrologer Kavita offers astrology-led services — kundli analysis, kundli milan for marriage matching, muhurat selection, career and business consultations, gemstone and remedial guidance — and the integrated life reading, in which the birth chart and the home's vastu are read together. Each service page states its length, what to prepare and what you receive.",
};

export const ASTROLOGY_SERVICE_LABELS = {
  lead: { astrology: "Astrology-led", vastu: "Vastu-led", integrated: "Integrated" },
  minutes: (n: number) => `${n} minutes`,
  allLink: { label: "All services", href: "/services" },
} as const;

export const ASTROLOGY_WHERE: HubSection = {
  id: "where",
  eyebrow: "Online, worldwide",
  question: "Where can you consult a Vedic astrologer online with Astrologer Kavita?",
  answer:
    "Astrologer Kavita consults online with clients in India, the United States, the United Kingdom, the United Arab Emirates, Canada, Australia and Singapore, scheduled in the client's local time. Each country and major city has its own page with the live-session window, the regional chart style and calendar, and the questions clients from that place most often bring.",
};

export const ASTROLOGY_WHERE_LABELS = {
  countries: "By country",
  cities: "By city",
  linkLabel: (name: string) => `Astrologer in ${name}`,
} as const;

// ---------------------------------------------------------------------------------------------
// 11. FAQ
// ---------------------------------------------------------------------------------------------
export const ASTROLOGY_FAQ = {
  eyebrow: "Questions",
  heading: "What do people ask about Vedic astrology before a first reading?",
  answer:
    "Before a first Vedic astrology reading, people most often ask Astrologer Kavita whether an exact birth time is essential, why their Vedic sign differs from their Western one, what sade-sati means, whether a reading can be done online, and whether remedies are compulsory. The answers below are the ones given in a consultation.",
  items: [
    {
      question: "Do I need my exact birth time for a kundli?",
      answer:
        "An exact time gives the most precise chart, because the lagna — the rising sign that frames every house — changes roughly every two hours. If your time is uncertain, a reading is still possible: Astrologer Kavita leans on the Moon's sign and nakshatra and on the dasha, and tells you which parts of the chart she is confident in.",
    },
    {
      question: "Why is my Vedic sign different from my Western sign?",
      answer:
        "Vedic astrology uses the sidereal zodiac, fixed to the stars, while Western astrology uses the tropical zodiac, fixed to the seasons. The offset between them — the ayanamsa — is currently a little under twenty-four degrees, so a Sun that is tropical Leo may be sidereal Cancer. Both are correct within their own system.",
    },
    {
      question: "What is sade-sati, and should I be worried about it?",
      answer:
        "Sade-sati is the roughly seven-and-a-half-year period in which Saturn transits the sign before, the sign of, and the sign after your natal Moon. The tradition associates it with pressure and re-ordering, not disaster. A reading shows which phase you are in and which areas are affected, and the home's south-west is checked alongside it.",
    },
    {
      question: "What is a dasha, and how do I know which one I am in?",
      answer:
        "A dasha is a planetary period. In the Vimshottari system, nine grahas each govern a period of fixed length in a fixed order, starting from your Moon's nakshatra at birth. Your running major and sub-period are calculated from your birth details; the reading says what that period tends to bring and when it changes.",
    },
    {
      question: "Can a Vedic astrology reading be done online?",
      answer:
        "Yes. The chart is cast from your birth details in advance, and the session is held by video or phone in your own time zone. Nothing about a reading requires being in the same room; what matters is accurate birth details and enough time to talk the chart through. A written summary follows.",
    },
    {
      question: "Are remedies compulsory, and do I have to buy a gemstone?",
      answer:
        "No. Remedies in the Vedic tradition — mantra, charitable acts, fasting days, and gemstones only where the chart supports them — are supportive practices you may take up or leave. Astrologer Kavita never makes a reading conditional on a purchase, and a gemstone is discussed as one option among several.",
    },
    {
      question: "What is kundli milan, and is it only for arranged marriages?",
      answer:
        "Kundli milan is the comparison of two birth charts for compatibility, traditionally before marriage. It is used by couples who chose each other as much as by families arranging a match, because its value is the same either way: it shows where two people will find support and where they will need to make an effort.",
    },
    {
      question: "How is this different from a free online kundli?",
      answer:
        "A free online kundli is the calculation — the same positions Astrologer Kavita starts from. The reading is the interpretation: which of the chart's hundreds of factors matter for your question, how the running dasha and this year's transits change their weight, and, in an integrated session, what your home does to them.",
    },
  ] satisfies FaqItem[],
} as const;

export const ASTROLOGY_CTA = {
  eyebrow: "Next step",
  title: "Ready to have your chart read with your home in view?",
  body: "Book a kundli analysis on its own, or the integrated reading that adds the vastu of your home. Every session ends with a written summary.",
  primary: { label: "Book an astrology reading", href: "/book" },
  secondary: { label: "Ask a question first", href: "/contact" },
} as const;
