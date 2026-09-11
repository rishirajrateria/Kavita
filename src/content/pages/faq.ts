/**
 * `/faq` master page copy. The questions themselves come from the home FAQs (data layer), the
 * service details, the astrology and vastu hubs and the publishable locations; only the framing
 * lives here.
 */
export const FAQ_META = {
  /** 54 characters. */
  title: "FAQ | Astrology & Vastu Consultations Explained",
  /** 150–160 characters. */
  description:
    "Every question people ask Astrologer Kavita, answered in one place: how astrology and vastu work together, each service, birth times, apartments and cities.",
} as const;

export const FAQ_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const FAQ_HERO = {
  eyebrow: "Frequently asked questions",
  title: "Everything people ask, in one place",
  lede: "Answers Astrologer Kavita gives in consultations, grouped by topic: the combined method, each service, Vedic astrology, vastu, and the cities she consults with. Every answer is on this page in full; the search box only narrows the list.",
} as const;

export const FAQ_INTRO = {
  id: "about-this-page",
  eyebrow: "How to use this page",
  question: "Where can I find answers to common questions about Astrologer Kavita's consultations?",
  answer:
    "This page gathers every question Astrologer Kavita is regularly asked, with the same answers she gives in a session. Questions are grouped by the combined method, individual services, Vedic astrology, vastu and locations. Type a word into the filter to shorten the list; nothing is hidden from search engines or assistants.",
} as const;

export const FAQ_SEARCH = {
  label: "Filter questions",
  placeholder: "Type a word, e.g. birth time, apartment, Dubai",
  results: (shown: number, total: number) => `Showing ${shown} of ${total} questions`,
  none: "No question matches that word. Try a shorter one, or ask through the contact page.",
} as const;

export const FAQ_GROUPS = {
  general: {
    id: "general",
    eyebrow: "The method",
    heading: "What do people ask about the combined astrology-and-vastu method?",
    answer:
      "About the combined method, people most often ask Astrologer Kavita how astrology and vastu differ, whether she consults online from outside India, what to prepare, whether vastu applies to apartments, how much an exact birth time matters, and whether a reading replaces professional advice. Those answers open this page.",
  },
  services: {
    id: "services",
    eyebrow: "Services",
    heading: "What do people ask about each of Astrologer Kavita's services?",
    answer:
      "About individual services, people ask Astrologer Kavita what each one includes, who it suits, what to prepare and what they receive afterwards. The questions below are grouped by service, from the Integrated Life Reading to the Follow-up Session; each service page carries the same answers in context.",
  },
  astrology: {
    id: "astrology",
    eyebrow: "Vedic astrology",
    heading: "What do people ask about Vedic astrology?",
  },
  vastu: {
    id: "vastu",
    eyebrow: "Vastu",
    heading: "What do people ask about vastu?",
  },
  locations: {
    id: "by-location",
    eyebrow: "By location",
    heading: "What do people in different cities ask Astrologer Kavita?",
    answer:
      "Clients in different cities ask Astrologer Kavita about local time-zone windows, whether a home in their kind of housing can be reviewed from a plan, which chart style is common in their region, and which nearby landmarks or neighbourhoods she knows. The city pages answer these; the questions are gathered here.",
  },
} as const;

export const FAQ_CTA = {
  title: "Question not answered here?",
  body: "Send it through the contact page. Astrologer Kavita replies personally, and questions asked often enough are added to this page.",
  primaryHref: "/contact",
  primaryLabel: "Ask a question",
  secondaryHref: "/book",
  secondaryLabel: "Book a consultation",
} as const;
