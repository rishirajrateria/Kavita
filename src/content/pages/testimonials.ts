/**
 * `/testimonials` and `/share-your-experience` copy (CLAUDE.md §12: only real, consented client
 * feedback is ever shown; placeholders are visibly labelled and blocked by the build gate).
 */
import { TESTIMONIALS_STRIP } from "@/content/home";
import type { FaqItem } from "@/lib/seo/schema";

export const TESTIMONIALS_META = {
  /** 52 characters. */
  title: "Client Experiences | Astrology & Vastu Consultations",
  /** 150–160 characters. */
  description:
    "What clients of Astrologer Kavita say about their astrology and vastu consultations, in their own words and only with their permission, by service and region.",
} as const;

export const TESTIMONIALS_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const TESTIMONIALS_HERO = {
  eyebrow: "Client experiences",
  title: "In clients' own words",
  lede: "Every experience on this page was written by a real client of Astrologer Kavita and published only with their explicit permission. Nothing is invented, edited for effect, or rated unless the client gave a rating.",
} as const;

export const TESTIMONIALS_INTRO = {
  id: "how-collected",
  eyebrow: "How these are collected",
  question: "How does Astrologer Kavita collect and publish client experiences?",
  answer: TESTIMONIALS_STRIP.answer,
  body: [
    "Clients share an experience through the form on this site, by email or by message after a consultation. Each one is stored unpublished until the client has confirmed that it may appear with their first name and city. Ratings are shown only when the client gave one; the site never calculates or displays an average from feedback that was not given.",
  ],
} as const;

/** Same wording as the home page so a placeholder is unmistakable wherever it appears. */
export const TESTIMONIALS_PLACEHOLDER = {
  title: TESTIMONIALS_STRIP.placeholderTitle,
  note: TESTIMONIALS_STRIP.placeholderNote,
} as const;

export const TESTIMONIALS_LIST = {
  id: "experiences",
  eyebrow: "All experiences",
  question: "What have clients said about working with Astrologer Kavita?",
  answer:
    "The experiences below are from clients of Astrologer Kavita who agreed to have their words published, each showing the service they took, where they were consulting from and when. Use the filters to see experiences for a particular service or region; every filter is a plain link and works without JavaScript.",
  filters: {
    serviceLabel: "Filter by service",
    regionLabel: "Filter by region",
    all: "All",
    clear: "Clear filters",
  },
  empty: {
    title: "No experiences match this filter yet",
    body: "Astrologer Kavita publishes an experience only after the client confirms permission, so some services and regions will have none for a while. Clear the filters to see everything that has been published.",
  },
  none: {
    title: "No client experiences are published yet",
    body: "Astrologer Kavita publishes an experience only after a real client has written it and confirmed that it may appear with their first name and city. This page will fill as clients agree to share; nothing will be invented to fill it sooner.",
  },
  consentBadge: "Published with permission",
  unknownService: "Consultation",
  unknownLocation: "Location not stated",
  shareLink: { label: "Share your own experience", href: "/share-your-experience" },
} as const;

export const TESTIMONIALS_FAQ = {
  eyebrow: "Questions",
  heading: "What do people ask about the experiences on this page?",
  answer:
    "People ask Astrologer Kavita whether the experiences are genuine, why there is no star average, whether they can share their own, and how their details are protected. Every experience is written by a real client, ratings appear only when given, the form is open to any client, and details are used only with permission.",
  items: [
    {
      question: "Are these client experiences genuine?",
      answer:
        "Yes. Every experience published by Astrologer Kavita was written by a real client after a consultation and stored unpublished until the client confirmed it could appear with their first name and city. Nothing is invented, and a build check blocks the site from going live with placeholder text.",
    },
    {
      question: "Why is there no overall star rating?",
      answer:
        "Astrologer Kavita shows a rating on an experience only when that client gave one, and calculates an average only from genuine, consented ratings. While there are too few of those to be meaningful, no aggregate is shown, because an average built from a handful of ratings would mislead more than it informs.",
    },
    {
      question: "Can I share my own experience?",
      answer:
        "Yes, if you have had a consultation with Astrologer Kavita. Use the form on the share-your-experience page: it asks for your name, where you consulted from, the service, an optional rating, your words and an explicit permission checkbox. Your email is kept private and used only to confirm the submission.",
    },
    {
      question: "Will my full name or birth details be published?",
      answer:
        "No. Astrologer Kavita publishes at most a first name and a city, and only after you tick the permission box. Birth details, floor plans, email addresses and phone numbers are never published or shown to other visitors; they stay in the practice's records under the privacy policy.",
    },
  ] satisfies FaqItem[],
} as const;

// ---------------------------------------------------------------------------------------------
// /share-your-experience
// ---------------------------------------------------------------------------------------------

export const SHARE_META = {
  /** 43 characters. */
  title: "Share Your Experience | Astrologer Kavita",
  /** 150–160 characters. */
  description:
    "Had a consultation with Astrologer Kavita? Share your experience in your own words. Published only with your explicit permission, with first name and city.",
} as const;

export const SHARE_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const SHARE_HERO = {
  eyebrow: "Share your experience",
  title: "Tell others how it went",
  lede: "If you have consulted Astrologer Kavita, your words help others decide whether to. Write what you like, in any length. Nothing is published unless you tick the permission box, and then only with your first name and city.",
} as const;

export const SHARE_INTRO = {
  id: "how-it-works",
  eyebrow: "How it works",
  question: "What happens after I share my experience with Astrologer Kavita?",
  answer:
    "After you submit the form, your experience is stored unpublished and Astrologer Kavita reads it. If you ticked the permission box, it may be published on the testimonials page with your first name and city, exactly as you wrote it. If you did not, it stays private feedback. Your email is never published.",
} as const;

export const SHARE_FORM = {
  id: "form",
  heading: "Your experience",
  fields: {
    name: "Your name",
    nameHint: "Only your first name is ever published.",
    email: "Email address",
    emailHint: "Used only to confirm your submission. Never published.",
    location: "Where you consulted from",
    locationHint: "City and country, e.g. Pune, India or Dubai, UAE.",
    service: "Which service did you take?",
    servicePlaceholder: "Choose a service (optional)",
    rating: "Rating (optional)",
    ratingNone: "No rating",
    experience: "Your experience",
    experienceHint: "In your own words, at least a couple of sentences.",
    consent: "I agree this may be published with my first name and city",
    consentHint: "Leave unticked to send private feedback to Astrologer Kavita only.",
    submit: "Send my experience",
    sending: "Sending…",
  },
  privacy:
    "Your name, email and words are stored under the privacy policy and used only for this purpose. Astrologer Kavita may shorten an experience for length but never alters its meaning, and never publishes without permission.",
  success: {
    title: "Thank you — your experience has been received",
    body: "Astrologer Kavita will read it personally. If you gave permission, it may appear on the testimonials page once reviewed; if not, it stays private. There is nothing more you need to do.",
  },
  fallback: {
    title: "The form is not connected yet",
    body: "Submissions are being set up. In the meantime, send your experience directly and say whether it may be published with your first name and city:",
  },
  errors: {
    generic:
      "Something went wrong and your experience was not sent. Please try again, or use the contact details below.",
    validation: "Please check the highlighted fields and try again.",
    rateLimited:
      "Too many submissions from this connection. Please wait a few minutes and try again.",
  },
} as const;
