/**
 * Learn categories (CLAUDE.md §5 `/learn/[category]`, §9.10). Each category is one folder under
 * `src/content/articles/`; an article's `category` front-matter field must match a slug here.
 * Descriptions are plain declarative prose so answer engines can lift them.
 */
export type ArticleMotif = "north-chart" | "south-chart" | "compass" | "lines";

export interface ArticleCategory {
  readonly slug: string;
  readonly name: string;
  /** Short line under the category name on cards and hubs. */
  readonly description: string;
  /** The question-form H2 on the category hub page. */
  readonly question: string;
  /** 40–60 word self-contained answer under that H2 (§9.2). */
  readonly answer: string;
  readonly motif: ArticleMotif;
}

export const ARTICLE_CATEGORIES: readonly ArticleCategory[] = [
  {
    slug: "astrology-basics",
    name: "Astrology basics",
    description:
      "What a kundli is, what the chart can and cannot tell you, and how the timing systems of Vedic astrology work — in plain English, with every term defined.",
    question: "What does Vedic astrology actually read, and what does it need from you?",
    answer:
      "Vedic astrology reads a kundli — a chart of the sky cast for the date, time and place of birth — to describe a person's tendencies and the timing of life's phases. The articles in this section from Astrologer Kavita explain the chart's building blocks, its timing systems and what a reading genuinely requires from you.",
    motif: "north-chart",
  },
  {
    slug: "vastu-basics",
    name: "Vastu basics",
    description:
      "How vastu shastra reads a home or workplace, why it still applies to apartments and rented flats, and what can be corrected without demolition.",
    question: "What is vastu shastra, and does it apply to the home you actually live in?",
    answer:
      "Vastu shastra is the traditional Indian science of placing a building and its rooms in relation to the directions, the elements and the flow of light and air. Astrologer Kavita's vastu articles explain how the principles are read in modern apartments, rented flats and offices, and what can be corrected without structural change.",
    motif: "compass",
  },
  {
    slug: "astrology-and-vastu-together",
    name: "Astrology and vastu together",
    description:
      "Why the birth chart and the home are read as one picture, and how a combined reading changes the remedy compared with either science alone.",
    question: "How do the birth chart and the home combine into one reading?",
    answer:
      "The kundli shows what is unfolding in a person's life and when; the vastu of their home shows what in the physical environment is supporting or resisting it. Astrologer Kavita reads both together as one method with two instruments, so that a remedy fits the person and the place rather than just one of them.",
    motif: "lines",
  },
  {
    slug: "preparing-for-a-consultation",
    name: "Preparing for a consultation",
    description:
      "What to gather before a session — birth details, floor plan, photographs, questions — and how an online reading works across time zones.",
    question: "What should you have ready before an astrology and vastu consultation?",
    answer:
      "Before a consultation with Astrologer Kavita you need your date, time and place of birth, a floor plan or sketch of your home with its compass orientation, a few photographs, and the two or three questions that matter most. The articles here explain why each item is asked for and how to obtain it.",
    motif: "south-chart",
  },
] as const;

export function getArticleCategory(slug: string): ArticleCategory | undefined {
  return ARTICLE_CATEGORIES.find((c) => c.slug === slug);
}
