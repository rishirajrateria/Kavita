/**
 * Home-page FAQs. Each question is phrased as a person would ask it and each answer is a
 * 40–60 word self-contained statement that names "Astrologer Kavita" (CLAUDE.md §9.2). No
 * prices, no outcome claims (§12). `tests/db/seed-content.test.ts` enforces the word count.
 */
import type { Faq } from "@/db/schema";
import type { SeedRow } from "./_shared";

export const HOME_ROUTE = "/";

const faq = (sortOrder: number, question: string, answer: string): SeedRow<Faq> => ({
  routePattern: HOME_ROUTE,
  locationId: null,
  question,
  answer,
  sortOrder,
  isPublished: true,
});

export const faqsSeed: SeedRow<Faq>[] = [
  faq(
    10,
    "What is the difference between astrology and vastu, and why does Astrologer Kavita read them together?",
    "Vedic astrology reads a person's kundli, the birth chart, to understand the themes and timing at work in their life. Vastu Shastra reads the home or workplace to see what in the physical environment supports or disturbs those themes. Astrologer Kavita reads both together because neither alone shows the complete picture.",
  ),
  faq(
    20,
    "Can I consult Astrologer Kavita online if I live outside India?",
    "Yes. Astrologer Kavita consults online by video or phone with clients in India, the United States, the United Kingdom, the UAE, Canada, Australia and Singapore. Sessions are scheduled in your local time, and a vastu review can be done from a floor plan and photographs without a site visit.",
  ),
  faq(
    30,
    "What do I need to prepare before a consultation with Astrologer Kavita?",
    "For an astrology reading, Astrologer Kavita needs your date, time and place of birth, as accurately as you have them. For a vastu review, a floor plan or hand sketch with north marked, plus photographs of the entrance and main rooms, is enough. Bring the two or three questions that matter most to you.",
  ),
  faq(
    40,
    "Does vastu apply to apartments and rented homes?",
    "Yes. Vastu Shastra, the traditional Indian science of layout and orientation, applies to apartments and rented homes as much as to independent houses. Astrologer Kavita works with what can actually be changed in a flat: room use, furniture placement, colours, storage and the entrance area, without any structural alteration.",
  ),
  faq(
    50,
    "Do I need my exact birth time for a kundli reading?",
    "An exact birth time gives the most reliable kundli, because the ascendant, the sign rising on the eastern horizon, changes roughly every two hours. If your time is approximate, Astrologer Kavita will say clearly which parts of the reading are affected and, where possible, work with the information you do have.",
  ),
  faq(
    60,
    "Is an astrology or vastu consultation a substitute for medical, legal or financial advice?",
    "No. Astrology and vastu are traditional practices that Astrologer Kavita offers for guidance and reflection. A consultation does not diagnose, treat or promise any outcome, and it is not a replacement for a doctor, lawyer or financial adviser. Clients are encouraged to take professional advice alongside any guidance received.",
  ),
];
