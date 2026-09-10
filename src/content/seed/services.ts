/**
 * Working service list — the nine examples from CLAUDE.md §1 until the client confirms the
 * real list ({{LIST YOUR ACTUAL SERVICES}}). Durations not stated in the brief are marked as
 * assumptions in NEEDS-REAL-DATA.md. Prices are null ("on request") until supplied ({{PRICE}}).
 * Copy defines every Sanskrit term on first use and promises no outcomes (§12).
 */
import type { Service } from "@/db/schema";
import type { SeedRow } from "./_shared";

const PRICE_PLACEHOLDER = "{{PRICE}}";

const base = {
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  priceMinor: null,
  currency: null,
  prices: {},
  priceNote: PRICE_PLACEHOLDER,
  isActive: true,
} satisfies Partial<SeedRow<Service>>;

export const servicesSeed: SeedRow<Service>[] = [
  {
    ...base,
    slug: "integrated-life-reading",
    name: "Integrated Life Reading",
    lead: "integrated",
    durationMinutes: 90,
    shortDescription:
      "Your birth chart and the vastu of your home, read together in one session — what is happening in your life, when, and what in your environment is helping or holding it back.",
    description:
      "An Integrated Life Reading combines two traditional Indian sciences in a single consultation. Vedic astrology (Jyotish) reads your kundli — the birth chart cast from your date, time and place of birth — to understand the themes and timing at work in your life. Vastu Shastra, the traditional Indian science of building and layout, examines the home or workplace you live in. Reading the two together shows how your physical environment is amplifying or blocking what the chart describes, so the guidance you receive addresses both.",
    whatToPrepare: [
      "Date, time and place of birth (as exact as you have them)",
      "A rough floor plan or hand sketch of your home with the compass direction of the main entrance",
      "Two or three questions you most want to discuss",
    ],
    whatYouReceive: [
      "A live 90-minute consultation (video or phone)",
      "A written summary of the chart themes, the vastu observations and the suggested steps",
    ],
    deliveryModes: ["online_video", "online_phone", "in_person"],
    sortOrder: 10,
  },
  {
    ...base,
    slug: "kundli-analysis",
    name: "Kundli / Birth Chart Analysis",
    lead: "astrology",
    durationMinutes: 60,
    shortDescription:
      "A full reading of your kundli (Vedic birth chart): planetary positions, current dasha periods and the questions you bring.",
    description:
      "A kundli is the Vedic birth chart cast from your exact date, time and place of birth. This astrology-led session reads the chart's planetary placements, the dasha (the planetary period system that describes which influences are active when) and the transits of the current year, and relates them to the questions you bring — career, relationships, family, health themes or timing. It is offered as traditional guidance for reflection, not as a prediction of fixed outcomes.",
    whatToPrepare: [
      "Date, time and place of birth — birth time accuracy matters; say how sure you are",
      "The specific questions or decisions you want to look at",
    ],
    whatYouReceive: [
      "A live 60-minute consultation",
      "Your chart and a short written note of the main points discussed",
    ],
    deliveryModes: ["online_video", "online_phone", "in_person"],
    sortOrder: 20,
  },
  {
    ...base,
    slug: "kundli-milan",
    name: "Match Making / Kundli Milan",
    lead: "astrology",
    durationMinutes: 45,
    shortDescription:
      "Kundli milan compares two birth charts for compatibility, the traditional step before an engagement or marriage.",
    description:
      "Kundli milan (literally 'matching of charts') is the traditional Vedic comparison of two birth charts, usually before an engagement or marriage. This astrology-led session looks at the classical compatibility factors (the ashtakoota or eight-fold matching), the placement of Mars (the mangal dosha question families most often ask about) and the wider strengths and sensitivities of both charts, and discusses them with you honestly and without alarm.",
    whatToPrepare: [
      "Birth date, time and place for both people",
      "Any specific concern a family member has raised",
    ],
    whatYouReceive: [
      "A live 45-minute consultation",
      "A written matching summary in plain language",
    ],
    deliveryModes: ["online_video", "online_phone", "in_person"],
    sortOrder: 30,
  },
  {
    ...base,
    slug: "vastu-for-home",
    name: "Vastu Consultation for Home",
    lead: "vastu",
    durationMinutes: 60,
    shortDescription:
      "A vastu review of your house or apartment, on site or from a floor plan, with practical corrections that do not require demolition.",
    description:
      "Vastu Shastra is the traditional Indian science of how orientation, layout and the placement of rooms and elements affect the people living in a space. This vastu-led consultation reviews your home from a floor plan and photographs, or on site where available, identifies what is supporting and what is disturbing the household, and suggests practical, proportionate corrections — most of them achievable in an existing home without structural change.",
    whatToPrepare: [
      "A floor plan (an estate-agent plan, builder's plan or careful hand sketch) with north marked",
      "Photographs of the entrance, kitchen, bedrooms and any area of concern",
      "Who lives in the home and which rooms they use",
    ],
    whatYouReceive: [
      "A live 60-minute consultation",
      "A written vastu report with a prioritised list of corrections",
    ],
    deliveryModes: ["online_video", "floor_plan", "in_person"],
    sortOrder: 40,
  },
  {
    ...base,
    slug: "vastu-for-commercial",
    name: "Vastu for Commercial, Office and Factory",
    lead: "vastu",
    durationMinutes: 90,
    shortDescription:
      "Vastu for offices, shops, clinics and factories: entrance, cash and leadership positions, and workflow layout.",
    description:
      "A commercial vastu consultation applies Vastu Shastra — the traditional Indian science of layout and orientation — to a workplace. It reviews the entrance, the reception, where the owner or leadership sits, the position of the accounts or cash area, storage and production flow in a factory, and staff areas, from plans and photographs or on site. Recommendations are practical and phased so that a working business can adopt them without disruption.",
    whatToPrepare: [
      "Site or floor plan with north marked, and the plot boundary if you own the land",
      "Photographs of the entrance and main working areas",
      "What the business does and what you would like to review",
    ],
    whatYouReceive: [
      "A live 90-minute consultation",
      "A written commercial vastu report with phased recommendations",
    ],
    deliveryModes: ["online_video", "floor_plan", "in_person"],
    sortOrder: 50,
  },
  {
    ...base,
    slug: "muhurat-selection",
    name: "Muhurat (Auspicious Timing) Selection",
    lead: "astrology",
    durationMinutes: 30,
    shortDescription:
      "Choosing a muhurat — an astrologically supportive date and time — for a wedding, housewarming, business launch or important start.",
    description:
      "A muhurat is a date and time chosen, using the Vedic calendar (panchang) and your birth chart, as supportive for beginning something important: a wedding, a griha pravesh (housewarming), a business opening, signing a contract or starting a journey. This astrology-led service takes your event, your constraints and the charts of the people involved and returns a small set of workable dates and times with a note on why each was chosen.",
    whatToPrepare: [
      "The event, the city where it will take place, and the window of dates you can consider",
      "Birth details of the main people involved",
    ],
    whatYouReceive: [
      "A 30-minute discussion",
      "A written shortlist of dates and times with the reasoning",
    ],
    deliveryModes: ["online_video", "online_phone"],
    sortOrder: 60,
  },
  {
    ...base,
    slug: "career-and-business-consultation",
    name: "Career and Business Consultation",
    lead: "integrated",
    durationMinutes: 60,
    shortDescription:
      "Career direction, job changes and business decisions, read from your chart's timing and — where relevant — the vastu of your workplace.",
    description:
      "An integrated consultation for career and business questions. The astrology side reads the houses and planetary periods (dasha) in your kundli that relate to work, income, partnerships and timing. The vastu side, when you share a plan of your office, shop or home-office, looks at whether the space you work in supports or works against those same themes. Together they inform decisions about changes, launches, partnerships and timing.",
    whatToPrepare: [
      "Date, time and place of birth",
      "The decision or situation you are weighing, in a few lines",
      "Optional: a plan or photographs of where you work",
    ],
    whatYouReceive: [
      "A live 60-minute consultation",
      "A written note of the timing observations and any workplace vastu suggestions",
    ],
    deliveryModes: ["online_video", "online_phone", "in_person"],
    sortOrder: 70,
  },
  {
    ...base,
    slug: "gemstone-and-remedial-guidance",
    name: "Gemstone and Remedial Guidance",
    lead: "astrology",
    durationMinutes: 45,
    shortDescription:
      "Honest guidance on traditional remedies — gemstones, mantras, charitable acts and simple vastu adjustments — based on your own chart, not a generic list.",
    description:
      "Traditional Vedic practice offers remedies (upaya) intended to strengthen or pacify planetary influences seen in a birth chart: gemstones, mantras, fasting on particular days, charitable acts and small changes at home. This astrology-led session reviews your kundli and explains which, if any, are appropriate for you and why, including when a gemstone is not advisable. Nothing is sold; you receive guidance and a written note you can use anywhere.",
    whatToPrepare: [
      "Date, time and place of birth",
      "Any remedies you already follow or have been advised",
    ],
    whatYouReceive: [
      "A live 45-minute consultation",
      "A written note of the suggested remedies and cautions",
    ],
    deliveryModes: ["online_video", "online_phone", "in_person"],
    sortOrder: 80,
  },
  {
    ...base,
    slug: "follow-up-session",
    name: "Follow-up Session",
    lead: "integrated",
    durationMinutes: 30,
    shortDescription:
      "A short follow-up for existing clients to review changes, ask new questions or check timing.",
    description:
      "A 30-minute follow-up for clients who have already had a consultation with Astrologer Kavita. Use it to review vastu corrections you have made, revisit timing as a planetary period changes, or ask a specific new question against a chart that has already been studied.",
    whatToPrepare: ["Your previous written summary", "What has changed and what you want to ask"],
    whatYouReceive: [
      "A live 30-minute consultation",
      "A brief written addendum to your earlier summary",
    ],
    deliveryModes: ["online_video", "online_phone"],
    sortOrder: 90,
  },
];
