/**
 * `/book` and `/booking/[token]` copy (Phase 4, P4-B). Contact details, the practitioner's
 * timezone, in-person availability and the notice period all come from `site_settings`, never
 * from here. No outcome is promised, no number invented (CLAUDE.md §12).
 */
import type { FaqItem } from "@/lib/seo/schema";

export const BOOK_META = {
  /** 49 characters. */
  title: "Book a Consultation | Astrologer Kavita",
  /** 154 characters. */
  description:
    "Book an astrology, vastu or integrated consultation with Astrologer Kavita: choose a service, pick a time shown in your own time zone, and confirm in minutes.",
} as const;

export const BOOK_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const BOOK_HERO = {
  eyebrow: "Book a consultation",
  title: "Choose a time that suits you, wherever you are",
  lede: "Seven short steps: the service, how you would like to meet, a time shown in your own clock and in India's, your details, the question on your mind, a final check — and it is booked.",
} as const;

/** The seven steps, in order. `short` is the rail label; `title` is the screen's H2. */
export const BOOK_STEPS = [
  {
    key: "service",
    short: "Service",
    title: "Which consultation would you like?",
    hint: "Each service says whether it is astrology-led, vastu-led or integrated.",
  },
  {
    key: "mode",
    short: "Format",
    title: "How would you like to meet?",
    hint: "Video and phone sessions work from any country. In person is offered only in the practice city.",
  },
  {
    key: "time",
    short: "Time",
    title: "When suits you?",
    hint: "Every time is shown in your own clock and in Astrologer Kavita's, so nothing is lost in conversion.",
  },
  {
    key: "details",
    short: "Details",
    title: "Your details",
    hint: "Only what the session needs. Birth details and floor plans are encrypted and never published.",
  },
  {
    key: "question",
    short: "Question",
    title: "What would you like to look at?",
    hint: "A few lines are enough. This helps Astrologer Kavita prepare before the session.",
  },
  {
    key: "review",
    short: "Review",
    title: "Check everything before you confirm",
    hint: "You can change any step. Nothing is booked until you press confirm.",
  },
  {
    key: "done",
    short: "Confirmed",
    title: "Your consultation is booked",
    hint: "",
  },
] as const;

export type BookStepKey = (typeof BOOK_STEPS)[number]["key"];

export const BOOK_NAV = {
  back: "Back",
  next: "Continue",
  confirm: "Confirm booking",
  confirming: "Booking…",
  edit: "Change",
  skip: "Skip for now",
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
} as const;

export const BOOK_SERVICE_STEP = {
  leadLabel: {
    astrology: "Astrology-led",
    vastu: "Vastu-led",
    integrated: "Integrated",
  },
  priceOnRequest: "Fee confirmed before the session",
  from: (place: string) => `Booking from ${place}`,
  changeService: "Choose a different service",
} as const;

export const BOOK_MODE_STEP = {
  modes: {
    online_video: {
      label: "Video call",
      description: "Google Meet, Zoom or WhatsApp video. Chart and floor plan shared on screen.",
    },
    online_phone: {
      label: "Phone call",
      description: "A voice call to your number. Best when your connection is uncertain.",
    },
    in_person: {
      label: "In person",
      description: (city: string) => `At the practice in ${city}, by appointment.`,
    },
  },
  inPersonUnavailable: (city: string) =>
    `In-person sessions are offered only in ${city}; online sessions work exactly the same way from anywhere.`,
} as const;

export const BOOK_TIME_STEP = {
  timezoneLabel: "Your time zone",
  timezoneHint: "Detected from your device. Change it if you will be somewhere else on the day.",
  detectedGroup: "Detected",
  practitionerLine: (zone: string, offset: string) =>
    `Astrologer Kavita is in ${zone}, ${offset}. Times on the right are hers.`,
  yourTime: "your time",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  noDaysThisMonth: "No free times this month. Try the next one.",
  pickADay: "Pick a day to see the free times.",
  noSlotsForDay: "Nothing free on this day. Choose another highlighted day.",
  slotsFor: (day: string) => `Free times on ${day}`,
  loading: "Checking free times…",
  loadFailed:
    "The free times could not be loaded just now. Please try again in a moment, or send your preferred days by WhatsApp or email.",
  retry: "Try again",
  selected: (label: string) => `Selected: ${label}`,
  legendAvailable: "Free times",
  legendToday: "Today",
  durationNote: (duration: string, buffer: string) =>
    `Each session lasts ${duration}${buffer ? ` with ${buffer} kept clear afterwards` : ""}.`,
} as const;

export const BOOK_DETAILS_STEP = {
  contact: {
    heading: "How to reach you",
    name: "Your name",
    email: "Email address",
    emailHint: "Your confirmation, calendar file and reminders go here.",
    dialCode: "Country code",
    customDialCode: "Other country code",
    customDialCodePlaceholder: "+49",
    phone: "Phone number",
    phoneHint: "For the call itself if you chose phone, and for a WhatsApp message on the day.",
    language: "Preferred language for the session (optional)",
    languageHint: "English, Hindi or another language she offers.",
  },
  birth: {
    heading: "Birth details for the chart",
    why: "Why we need this: a kundli (Vedic birth chart) is cast from the exact date, time and place of birth. A few minutes' difference can move the rising sign, so say how sure you are of the time; an approximate time still gives a useful reading.",
    date: "Date of birth",
    time: "Time of birth",
    timeHint: "As on your birth certificate or as your family remembers it.",
    accuracy: "How sure are you of the time?",
    accuracyOptions: {
      exact: "Exact, from a record",
      approximate: "Within an hour or so",
      unknown: "Not known",
    },
    place: "Place of birth",
    placeHint: "Town or city and country, e.g. Nagpur, India.",
    privacy:
      "Birth details are encrypted before they are stored, used only for your reading, never shown on the site and deleted on request.",
  },
  property: {
    heading: "About the property",
    why: "Why we need this: vastu advice depends on what the building is and which way it faces. A floor plan with north marked lets Astrologer Kavita prepare directional notes before the session; if you do not have one yet, a hand sketch on the day is fine.",
    type: "Type of property",
    typeOptions: {
      apartment: "Apartment / flat",
      independent_house: "Independent house",
      villa: "Villa / bungalow",
      office: "Office",
      shop: "Shop or showroom",
      factory: "Factory or warehouse",
      plot: "Plot of land",
      other: "Other",
    },
    facing: "Which way does the main entrance face? (optional)",
    facingHint:
      "A compass direction such as north-east, or degrees from a phone compass, e.g. 45°.",
    floorPlan: "Floor plan (optional)",
    floorPlanHint: "PDF, PNG, JPG or WebP up to 10 MB, with north marked if you can.",
    uploading: "Uploading…",
    uploaded: (name: string) => `Attached: ${name}`,
    remove: "Remove",
    uploadUnavailable:
      "Floor-plan upload is not switched on yet. Please continue with the booking and send the plan by WhatsApp or email once your time is confirmed.",
    uploadTooLarge: "That file is over 10 MB. Please export a smaller PDF or a photo of the plan.",
    uploadWrongType: "Please attach a PDF, PNG, JPG or WebP file.",
    uploadFailed:
      "The plan could not be uploaded just now. You can continue and send it by WhatsApp or email once your time is confirmed.",
  },
  optional: {
    heading: "Optional",
    gender: "How do you describe your gender? (optional)",
    genderHint:
      "Skippable. Used only so that Astrologer Kavita can use the right form of address, and in anonymous totals.",
    genderOptions: {
      unspecified: "Prefer not to say",
      woman: "Woman",
      man: "Man",
      nonbinary: "Non-binary",
      self: "Self-described",
    },
    genderSelf: "In your own words",
    marketing: "Send me occasional notes from Astrologer Kavita — never more than a few a year.",
  },
} as const;

export const BOOK_QUESTION_STEP = {
  label: "What is on your mind?",
  hint: "The decision, the period of life or the room that prompted this. Two or three lines are plenty; leave out anything you would rather say in the session.",
  placeholder:
    "For example: we are moving into a new flat in April and I want to check the timing and the layout together.",
  counter: (n: number, max: number) => `${n} / ${max}`,
} as const;

export const BOOK_REVIEW_STEP = {
  labels: {
    service: "Consultation",
    mode: "Format",
    time: "Time",
    yourZone: "In your time zone",
    herZone: "In Astrologer Kavita's",
    name: "Name",
    email: "Email",
    phone: "Phone",
    birth: "Birth details",
    property: "Property",
    floorPlan: "Floor plan",
    question: "Your question",
    notGiven: "Not given",
    attached: "Attached",
    toFollow: "To follow by WhatsApp or email",
  },
  birthSummary: (date: string, time: string | null, place: string) =>
    `${date}${time ? `, ${time}` : ", time not known"}, ${place}`,
  terms:
    "By confirming you agree to the terms of service and privacy policy, and confirm that you are 18 or over. The fee is confirmed with you before the session; nothing is charged on this site.",
  termsLink: "Terms",
  privacyLink: "Privacy",
} as const;

export const BOOK_CONFIRMATION = {
  eyebrow: "Booked",
  title: "Your consultation is booked",
  body: (service: string) =>
    `Astrologer Kavita has your ${service} in her diary. A confirmation email with the details below is on its way, and a reminder follows the day before.`,
  addToCalendar: "Add to your calendar",
  google: "Google Calendar",
  outlook: "Outlook",
  apple: "Apple Calendar / .ics",
  manage: "Reschedule or cancel",
  manageHint: (hours: number) =>
    `You can move or cancel this booking yourself up to ${hours} hours before it starts, from the link in your email or the button above.`,
  prepareHeading: "What to have ready",
  paymentNote:
    "No payment is taken on this site. Astrologer Kavita confirms the fee and the way to pay with you directly.",
  bookAnother: "Book another consultation",
} as const;

export const BOOK_ERRORS = {
  validation: "Please check the highlighted fields and try again.",
  rateLimited: "Too many attempts from this connection. Please wait a few minutes and try again.",
  network: "The booking service could not be reached. Check your connection and try again.",
  server:
    "Something went wrong on our side and the booking was not made. Please try again, or send your preferred time by WhatsApp or email.",
  slotTaken:
    "That time was taken a moment ago. The nearest free times are below — pick one and confirm again.",
  slotGone: "That time is no longer available. Please choose another from the calendar.",
  chooseAlternative: "Choose this time",
  backToCalendar: "See the full calendar",
  notConnected: {
    title: "Online booking is not switched on yet",
    body: "Your request has not been lost — send the summary below by WhatsApp or email and Astrologer Kavita will confirm the time personally. Birth details are left out on purpose; she will ask for them privately.",
    send: "Send by WhatsApp",
    email: "Send by email",
    noChannels:
      "Contact details are being confirmed; please try again in a few days or use the contact page.",
  },
  noScript: {
    title: "The booking calendar needs JavaScript",
    body: "To book without it, send the service you would like and two or three days that suit you:",
  },
} as const;

export const BOOK_HOW = {
  id: "how-booking-works",
  eyebrow: "How it works",
  question: "How does booking a consultation with Astrologer Kavita work?",
  answer:
    "Booking a consultation with Astrologer Kavita takes seven short steps on this page: choose the service, choose video, phone or in person, pick a time shown in your own time zone and in India's, give your details and question, review, and confirm. A confirmation email and calendar file follow at once.",
  steps: [
    "Choose the service — each one says whether it is astrology-led, vastu-led or integrated.",
    "Choose video, phone or, in the practice city, in person.",
    "Pick a day and a time. Every time is shown twice: in your clock and in Astrologer Kavita's.",
    "Give your contact details and, for a chart, your birth details; for a vastu review, the property and a floor plan if you have one.",
    "Say in a few lines what you would like to look at.",
    "Check the summary and confirm.",
    "Receive the confirmation email with a calendar file and a link to reschedule or cancel.",
  ],
} as const;

export const BOOK_FAQ = {
  eyebrow: "Before you book",
  heading: "What do people ask before booking a consultation?",
  answer:
    "Before booking, people ask Astrologer Kavita whether the time shown is really in their own zone, what happens if they need to move the session, whether birth details are safe, how the fee is paid and what to prepare. The answers are below; anything else can go in the question box on the form.",
  items: [
    {
      question: "Is the time I choose shown in my own time zone?",
      answer:
        "Yes. The calendar detects your device's time zone and shows every free time in your own clock, with Astrologer Kavita's Indian time beside it. If you will be in another city on the day, change the zone from the list above the calendar and the times update at once; the confirmation email shows both.",
    },
    {
      question: "Can I reschedule or cancel a booking?",
      answer:
        "Yes. The confirmation email contains a private link that lets you move the session to another free time or cancel it yourself, up to the notice period shown on that page. Inside the notice period, send a WhatsApp message and Astrologer Kavita will do what she reasonably can.",
    },
    {
      question: "Are my birth details safe?",
      answer:
        "Birth date, time and place are encrypted before they are stored, are read only by Astrologer Kavita for your consultation, are never shown on the site or used for marketing, and are deleted when you ask. The privacy policy sets out exactly what is kept and for how long.",
    },
    {
      question: "How and when do I pay?",
      answer:
        "Nothing is charged on this site. Astrologer Kavita confirms the fee for the service you chose, in your currency where possible, and the way to pay, directly with you after the booking is made. The session goes ahead once that is settled between you.",
    },
    {
      question: "What should I have ready for the session?",
      answer:
        "For an astrology-led session: your birth date, time and place, and the questions you want to look at. For a vastu-led session: a floor plan or sketch with north marked, and photographs of the entrance and main rooms if you have them. For an integrated reading, both. The confirmation email repeats this list.",
    },
  ] satisfies FaqItem[],
} as const;

export const MANAGE_PAGE = {
  eyebrow: "Your booking",
  title: (service: string) => `Your ${service}`,
  invalid: {
    title: "This booking link is not valid",
    body: "The link may have expired, or the booking may have been cancelled. Please check the latest email from Astrologer Kavita, or get in touch and she will find it for you.",
  },
  notConnected: {
    title: "Bookings cannot be looked up right now",
    body: "The booking system is being connected. Please use the confirmation email you received, or contact Astrologer Kavita directly.",
  },
  status: {
    pending: "Awaiting confirmation",
    confirmed: "Confirmed",
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    payment_pending_offline: "Confirmed — fee to be settled directly",
    rescheduled: "Rescheduled",
    cancelled: "Cancelled",
    completed: "Completed",
    no_show: "Missed",
  },
  labels: {
    when: "When",
    yourZone: "In your time zone",
    herZone: "In Astrologer Kavita's",
    format: "Format",
    duration: "Length",
    reference: "Reference",
  },
  reschedule: {
    heading: "Need a different time?",
    intro: (hours: number) =>
      `You can move this session yourself up to ${hours} hours before it starts. Choose a new time below; the old one is released as soon as the new one is confirmed.`,
    button: "Choose a new time",
    confirm: "Move to this time",
    moving: "Moving…",
    moved: "Your session has been moved. A fresh confirmation email is on its way.",
    tooLate: (hours: number) =>
      `This session starts in under ${hours} hours, so it can no longer be moved online. Send a WhatsApp message and Astrologer Kavita will do what she reasonably can.`,
  },
  cancel: {
    heading: "Cancel this booking",
    intro: (hours: number) =>
      `Cancel yourself up to ${hours} hours before the session. Inside that window, please get in touch instead.`,
    button: "Cancel booking",
    confirmTitle: "Cancel this consultation?",
    confirmBody:
      "The time is released for someone else and you receive a short confirmation by email. You can book again at any time.",
    reason: "Reason (optional)",
    keep: "Keep the booking",
    confirm: "Yes, cancel it",
    cancelling: "Cancelling…",
    cancelled: "Your booking has been cancelled. A confirmation email is on its way.",
    tooLate: (hours: number) =>
      `This session starts in under ${hours} hours, so it can no longer be cancelled online. Send a WhatsApp message and Astrologer Kavita will do what she reasonably can.`,
  },
  closed: {
    cancelled: "This booking was cancelled. You are welcome to book a new time.",
    rescheduled:
      "This booking was moved to a new time; the newer confirmation email has the current link.",
    completed: "This session has taken place. Thank you.",
  },
  bookAgain: "Book a new consultation",
} as const;
