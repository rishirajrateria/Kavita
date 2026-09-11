/**
 * Question-phrased H2s and their 40–60 word self-contained answers for every geo block
 * (CLAUDE.md §9.2). Each answer names Astrologer Kavita and the place, and reads correctly when
 * quoted alone. Phrasing varies by tier and by service so no two pages share boilerplate, and
 * every fact comes from the location record, the research or `site_settings` — nothing is
 * invented. `tests`/the verification script count words across all published locations.
 */
import type { ChartStyle, LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { GEO_SERVICE_META } from "@/lib/geo/service";

export interface Question {
  eyebrow: string;
  question: string;
  answer: string;
}

export interface AnswerContext {
  loc: LocationRecord;
  service: GeoService;
  /** From `computeConsultationWindow`. */
  offsetMinutes?: number;
  localWindow?: string;
  responseTimeHours?: number;
  siblingNames?: string[];
  childrenCount?: number;
}

const CHART_SHORT: Record<ChartStyle, string> = {
  "north-indian": "North Indian (diamond)",
  "south-indian": "South Indian (square)",
  "east-indian": "East Indian",
  mixed: "North or South Indian",
};

/** Human phrase for a minute offset: "4h30 behind", "9h30 ahead of", "on the same clock as". */
export function offsetPhrase(minutes: number): string {
  if (minutes === 0) return "on the same clock as";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const span = m ? `${h}h${String(m).padStart(2, "0")}` : `${h} hour${h === 1 ? "" : "s"}`;
  return minutes > 0 ? `${span} ahead of` : `${span} behind`;
}

const wordsOf = (s: string) => s.trim().split(/\s+/).length;
/** Use a research phrase only when it is short enough to keep the answer under 60 words. */
const brief = (text: string | undefined, maxWords: number, fallback: string) =>
  text && wordsOf(text) <= maxWords ? text : fallback;

const list = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function openingQuestion({ loc, service }: AnswerContext): Question {
  const n = loc.name;
  const astro = service === "astrologer";
  if (loc.type === "country") {
    return {
      eyebrow: "Why here",
      question: astro
        ? `Why do clients across ${n} consult Astrologer Kavita?`
        : `Why do households across ${n} ask Astrologer Kavita for vastu?`,
      answer: astro
        ? `Clients across ${n} consult Astrologer Kavita for a Vedic astrology reading that treats the home as part of the same question. The kundli, the birth chart cast from the date, time and place of birth, shows what is unfolding and when; the vastu of the home shows what is helping or holding it back.`
        : `Households across ${n} ask Astrologer Kavita for vastu because she reads the home for the people in it. Vastu shastra, the Indian science of built space, is applied to the floor plan; the occupants' birth charts say which rooms and directions matter most right now, so the remedies are few and specific.`,
    };
  }
  if (loc.type === "state") {
    return {
      eyebrow: "Why here",
      question: astro
        ? `Why do people in ${n} book a chart reading with Astrologer Kavita?`
        : `What does a vastu consultation for a home in ${n} involve?`,
      answer: astro
        ? `People in ${n} book a reading with Astrologer Kavita to see the timing behind a decision, not only its outcome. Vedic astrology, or jyotish, divides a life into planetary periods called dashas; reading the current dasha against the home's vastu gives one clear picture of what to change and when.`
        : `A vastu consultation for a home in ${n} with Astrologer Kavita starts from the floor plan and a compass reading at the entrance. Room use, sleeping direction, storage and colour are assessed against the occupants' birth charts, so the suggestions fit both the building and the people living in it.`,
    };
  }
  return {
    eyebrow: "Why here",
    question: astro
      ? `Why do people from ${n} consult Astrologer Kavita?`
      : `Why do homeowners and tenants in ${n} consult Astrologer Kavita?`,
    answer: astro
      ? `People from ${n} consult Astrologer Kavita because a birth chart alone answers only half the question. The kundli shows the planetary periods shaping a life and when they turn; the vastu of a ${n} home shows what in the surroundings is amplifying or blocking them. Reading both together yields one set of remedies.`
      : `Homeowners and tenants in ${n} consult Astrologer Kavita because vastu shastra, the Indian science of building and orientation, is read here for the people living in the home. The floor plan of a ${n} home is assessed alongside the occupants' birth charts, so remedies are non-structural wherever possible and specific to them.`,
  };
}

export function childrenQuestion({ loc, service, childrenCount = 0 }: AnswerContext): Question {
  const n = loc.name;
  const astro = service === "astrologer";
  const what = astro ? "chart reading" : "vastu review";
  if (loc.type === "country") {
    return {
      eyebrow: "Places",
      question: `Where in ${n} does Astrologer Kavita consult?`,
      answer: `Astrologer Kavita consults online with clients anywhere in ${n}, by video or phone in local hours. The ${childrenCount} regions and cities listed below have pages of their own, each written for that place's housing, calendar and time zone; a client elsewhere in ${n} books a ${what} in exactly the same way.`,
    };
  }
  return {
    eyebrow: "Cities",
    question: `Which cities in ${n} does Astrologer Kavita write about separately?`,
    answer: `Within ${n}, Astrologer Kavita has written a separate page for each city listed below, because housing stock, local calendar and the questions people bring differ from one city to the next. A client anywhere else in ${n} books a ${what} on the same terms and in the same local hours.`,
  };
}

export function combinedQuestion({ loc, service }: AnswerContext): Question {
  const n = loc.name;
  const home = loc.type === "city" ? `a ${n} home` : `a home in ${n}`;
  return {
    eyebrow: "One method",
    question:
      service === "astrologer"
        ? `How does Astrologer Kavita read a birth chart and ${home} together?`
        : `How does Astrologer Kavita combine vastu with astrology for ${home}?`,
    answer:
      service === "astrologer"
        ? `For a client in ${n}, Astrologer Kavita reads the kundli first, to see which planetary periods are active, and then the floor plan of the home, to see which rooms and directions carry those themes. The two readings produce one diagnosis and one short list of remedies rather than two separate lists.`
        : `For ${home}, Astrologer Kavita reads the floor plan alongside the occupants' birth charts. The chart shows which areas of life are under pressure and when; the plan shows which direction and room governs that area. Remedies are then chosen for the people who live there, not for the building in the abstract.`,
  };
}

export function traditionQuestion({ loc }: AnswerContext): Question {
  const n = loc.name;
  const style = CHART_SHORT[loc.research?.tradition.chartStyle ?? "mixed"];
  const scope = loc.type === "city" ? `someone born in ${n}` : `a client from ${n}`;
  return {
    eyebrow: "Chart and calendar",
    question:
      loc.type === "country"
        ? `Which chart style and calendar apply to a kundli in ${n}?`
        : `How is a kundli cast for ${scope}?`,
    answer: `For ${scope}, Astrologer Kavita draws the kundli in the ${style} style and reads dates against the calendar the family follows. Chart style changes how the same planetary positions are drawn, not what they mean; the calendar decides which month, tithi and festival the family recognises when timing is discussed.`,
  };
}

export function architectureQuestion({ loc }: AnswerContext): Question {
  const n = loc.name;
  const stock = brief(
    loc.research?.climateArchitecture.housingStock,
    7,
    "the housing types described below",
  );
  return {
    eyebrow: "Climate and housing",
    question:
      loc.type === "city"
        ? `What makes vastu for a ${n} home different?`
        : `How do climate and housing in ${n} change vastu advice?`,
    answer: `Vastu advice for ${n} starts from its housing, mainly ${stock}, and from where the sun and prevailing wind actually come from. Astrologer Kavita adapts the traditional preferences for open north-east and heavy south-west sides to those conditions, and works from a floor plan and compass reading rather than requiring a site visit.`,
  };
}

export function consultingQuestion({
  loc,
  offsetMinutes = 0,
  localWindow,
}: AnswerContext): Question {
  const n = loc.name;
  const hours = localWindow ? `, so live sessions fall around ${localWindow}` : "";
  return {
    eyebrow: "From where you are",
    question:
      loc.type === "country"
        ? `How does an online consultation from ${n} work with Astrologer Kavita?`
        : `What is a consultation from ${n} like in practice?`,
    answer: `A consultation from ${n} with Astrologer Kavita is a live video or phone session booked in local time. ${n} is ${offsetPhrase(offsetMinutes)} the practitioner's clock${hours}. Birth details or a floor plan are sent before the call, and a written summary of the reading follows it.`,
  };
}

export function tableQuestion(
  { loc }: AnswerContext,
  kind: "timezones" | "cities" | "modes" | "chart" | "vastu",
): Question {
  const n = loc.name;
  switch (kind) {
    case "timezones":
      return {
        eyebrow: "Time zones",
        question: `Which time zones does ${n} use, and when can you consult live?`,
        answer: `The table below lists every time zone in use across ${n} for the places Astrologer Kavita writes about, with today's UTC offset, whether daylight saving applies, and the local hours in which a live session falls. The windows are computed from the practitioner's business hours, so they change with daylight saving.`,
      };
    case "cities":
      return {
        eyebrow: "Session windows",
        question: `In which hours can people in ${n}'s cities consult Astrologer Kavita?`,
        answer: `Each city in ${n} listed below keeps the same time zone, but the table states it explicitly with the difference from the practitioner's clock and the local hours in which a live session with Astrologer Kavita falls. Sessions are booked in the client's own time, and the written summary arrives afterwards.`,
      };
    case "modes":
      return {
        eyebrow: "How it works",
        question: `How can you consult Astrologer Kavita from ${n}?`,
        answer: `From ${n}, a consultation with Astrologer Kavita takes place by video call or by phone, in the local hours shown below; a vastu review can also be done entirely from a floor plan and photographs. The table states what each mode needs from you and when it falls in ${n}'s own time.`,
      };
    case "chart":
      return {
        eyebrow: "What to prepare",
        question: `What should someone born in ${n} prepare for a kundli reading?`,
        answer: `Someone born in ${n} should send Astrologer Kavita their date, exact time and place of birth, say how sure they are of the time, and mention which chart style their family uses. The table below sets out the chart style, calendar, birth-record notes and time zone that apply to a ${n} birth.`,
      };
    default:
      return {
        eyebrow: "What to prepare",
        question: `What should you prepare for a vastu consultation of a home in ${n}?`,
        answer: `For a vastu consultation of a home in ${n}, send Astrologer Kavita a floor plan or hand sketch with north marked, a compass reading taken at the main entrance, photographs of the main rooms, and the birth details of the people who live there. The table below lists each item and what it is for.`,
      };
  }
}

export function faqQuestion({ loc }: AnswerContext): Question {
  const n = loc.name;
  return {
    eyebrow: "Questions people ask",
    question: `What do people in ${n} ask Astrologer Kavita before booking?`,
    answer: `The questions below are the ones people from ${n} most often put to Astrologer Kavita before booking, each answered for ${n} rather than in general terms. They cover how the consultation runs from there, what to prepare, and what a reading of the chart and the home can and cannot honestly claim.`,
  };
}

export function testimonialQuestion({ loc }: AnswerContext): Question {
  const n = loc.name;
  return {
    eyebrow: "Client experience",
    question: `What was a consultation like for a client from ${n}?`,
    answer: `The experience below was given by a real client from ${n} in their own words and is published with their explicit consent. Astrologer Kavita does not invent, edit for effect or rate client feedback; no star rating is shown unless the client gave one, and nothing is attributed to a place the client did not name.`,
  };
}

export function linksQuestion({ loc, service, siblingNames = [] }: AnswerContext): Question {
  const n = loc.name;
  const other = GEO_SERVICE_META[GEO_SERVICE_META[service].counterpart].label.toLowerCase();
  const names = siblingNames.slice(0, 3);
  const nearby = names.length ? `in ${list(names)} as well as ${n}` : `in ${n} and nearby places`;
  if (loc.type === "state") {
    return {
      eyebrow: "Other regions",
      question: `Which other regions does Astrologer Kavita cover besides ${n}?`,
      answer: `Besides ${n}, Astrologer Kavita consults with clients ${nearby}; each region has its own page written for its housing, calendar and hours rather than a copy of this one. The ${n} page for the ${other} covers the same region from the other half of the method.`,
    };
  }
  return {
    eyebrow: "Nearby",
    question: `Where else near ${n} does Astrologer Kavita consult?`,
    answer: `Astrologer Kavita consults with clients ${nearby}; each place has its own page written for its housing, calendar and local hours. The ${n} page for the ${other} covers the same city from the other side of the method, and the region page lists every city.`,
  };
}

export function ctaQuestion({ loc, responseTimeHours }: AnswerContext): Question {
  const n = loc.name;
  const reply = responseTimeHours ? `usually within ${responseTimeHours} hours` : "promptly";
  return {
    eyebrow: "Next step",
    question: `How do you book a consultation from ${n} with Astrologer Kavita?`,
    answer: `To book from ${n}, choose the integrated reading, which covers the birth chart and the home together, pick a time shown in ${n}'s own hours, and send your birth details or floor plan in advance. Astrologer Kavita replies to enquiries ${reply}; WhatsApp and email are open for questions before you commit.`,
  };
}
