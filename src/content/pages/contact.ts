/**
 * `/contact` copy. Contact details themselves come from `site_settings`, never from here.
 */
import type { FaqItem } from "@/lib/seo/schema";

export const CONTACT_META = {
  /** 44 characters. */
  title: "Contact | Ask Astrologer Kavita a Question",
  /** 150–160 characters. */
  description:
    "Contact Astrologer Kavita by WhatsApp, phone, email or the form: ask which consultation fits, check a time in your time zone, or arrange to send a floor plan.",
} as const;

export const CONTACT_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const CONTACT_HERO = {
  eyebrow: "Contact",
  title: "Ask a question, or send what you have",
  lede: "Not sure which consultation fits, or want to check a time that works across time zones? Send a message here or on WhatsApp. Birth details and floor plans can wait until a session is confirmed.",
} as const;

export const CONTACT_CHANNELS = {
  id: "ways-to-reach",
  eyebrow: "Ways to reach the practice",
  question: "How can I contact Astrologer Kavita?",
  answer:
    "You can contact Astrologer Kavita by WhatsApp message, by phone during her working hours, by email, or through the form on this page. Enquiries are usually answered within a working day. For a consultation, WhatsApp or the form is quickest; for sending a floor plan, email works best.",
  labels: {
    whatsapp: "WhatsApp",
    phone: "Phone",
    email: "Email",
    hours: "Working hours",
    timezone: "Time zone",
    responseTime: "Typical response",
    inPerson: "In person",
    address: "Address",
  },
  inPersonYes: (city: string) => `Available in ${city} by appointment`,
  inPersonNo: "Online consultations only at present",
  responseTime: (hours: number) => `Within ${hours} hours on working days`,
  pending: "Being confirmed — please use the form for now",
} as const;

export const CONTACT_FORM = {
  id: "form",
  eyebrow: "Message",
  question: "What should I include in a message to Astrologer Kavita?",
  answer:
    "A message to Astrologer Kavita is most useful when it says which service interests you, where you are, and two or three days that suit you. For a chart reading, mention how sure you are of your birth time; for a vastu review, say whether you have a floor plan. Leave birth details out of the first message.",
  fields: {
    name: "Your name",
    email: "Email address",
    phone: "Phone (optional)",
    phoneHint: "With country code, so a call back works from any country.",
    dialCode: "Country code",
    customDialCode: "Other country code",
    customDialCodePlaceholder: "+49",
    message: "Your message",
    messageHint: "Which service, where you are, and when suits you.",
    submit: "Send message",
    sending: "Sending…",
  },
  privacy:
    "Your message is stored under the privacy policy and used only to reply to you. Do not include birth details or health information in this first message; Astrologer Kavita will ask for what is needed once a session is arranged.",
  success: {
    title: "Thank you — your message has been received",
    body: "Astrologer Kavita will reply by email, or by phone if you gave a number, usually within a working day.",
  },
  fallback: {
    title: "The form is not connected yet",
    body: "Messages through the site are being set up. Please use one of these instead:",
  },
  errors: {
    generic:
      "Something went wrong and your message was not sent. Please try again, or use WhatsApp or email.",
    validation: "Please check the highlighted fields and try again.",
    rateLimited: "Too many messages from this connection. Please wait a few minutes and try again.",
  },
} as const;

export const CONTACT_FAQ = {
  eyebrow: "Questions",
  heading: "What do people ask before getting in touch?",
  answer:
    "Before getting in touch, people ask Astrologer Kavita how quickly she replies, whether she takes calls outside Indian hours, whether to send birth details straight away, how a floor plan should be sent, and whether messages are confidential. The short answers are below; anything else, just ask.",
  items: [
    {
      question: "How quickly does Astrologer Kavita reply?",
      answer:
        "Astrologer Kavita replies to messages personally, usually within a working day, and sooner on WhatsApp during her working hours. The exact response time she works to is shown on this page. If you have not heard back within two working days, send a short follow-up; messages occasionally go astray.",
    },
    {
      question: "Can I call from the United States, the United Kingdom or Australia?",
      answer:
        "Yes. Astrologer Kavita takes calls and video sessions with clients in every time zone, scheduled at a time that works for both sides; the geo pages show a typical live-session window for your city. A WhatsApp message first is easiest, so that a call can be arranged rather than missed.",
    },
    {
      question: "Should I send my birth details with the first message?",
      answer:
        "No. Astrologer Kavita asks for birth date, time and place only once a session is confirmed, through a private channel, and never needs them to answer a question about which service fits. Leaving them out of the first message keeps your personal data out of an email thread.",
    },
    {
      question: "How do I send a floor plan for a vastu review?",
      answer:
        "Once a vastu consultation is arranged, Astrologer Kavita will ask for your floor plan by email or WhatsApp: a photograph of a builder's or estate agent's plan, or a careful hand sketch, with north marked. Photographs of the entrance and main rooms can be sent the same way.",
    },
    {
      question: "Is what I write kept confidential?",
      answer:
        "Yes. Messages to Astrologer Kavita are read only by her, stored under the privacy policy, and never shared or published. Birth details and floor plans are treated as sensitive personal data. Client experiences appear on the site only when a client separately and explicitly agrees to that.",
    },
  ] satisfies FaqItem[],
} as const;

export const CONTACT_CTA = {
  title: "Ready to book rather than ask?",
  body: "Choose a service and send your preferred days. Astrologer Kavita confirms the time in your time zone and the fee before anything is fixed.",
  primaryHref: "/book",
  primaryLabel: "Book a consultation",
  secondaryHref: "/services",
  secondaryLabel: "See all services",
} as const;
