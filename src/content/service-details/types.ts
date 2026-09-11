import type { FaqItem } from "@/lib/seo/schema";

/** A question-phrased H2 with its 40–60 word `.answer` and the paragraphs beneath it. */
export interface DetailSection {
  readonly question: string;
  readonly answer: string;
  readonly body: readonly string[];
  /** Optional bulleted list rendered after the body. */
  readonly items?: readonly string[];
}

/** Two-column "what to prepare" table for integrated services (chart inputs + vastu inputs). */
export interface PrepareTable {
  readonly chart: readonly string[];
  readonly vastu: readonly string[];
}

export interface ServiceDetail {
  readonly slug: string;
  /** ≤ 60 characters. */
  readonly metaTitle: string;
  /** 150–160 characters. */
  readonly metaDescription: string;
  readonly lede: string;
  readonly whatItIs: DetailSection;
  readonly whoItIsFor: DetailSection;
  readonly whatIsIncluded: DetailSection;
  readonly whatToPrepare: DetailSection & { readonly table?: PrepareTable };
  readonly whatYouReceive: DetailSection;
  readonly howItFits: DetailSection;
  readonly faqs: readonly FaqItem[];
  /** Slugs of 2–3 related services. */
  readonly related: readonly string[];
  readonly datePublished: string;
  readonly dateModified: string;
}
