import type { Metadata } from "next";

export const BRAND = "Astrologer Kavita";
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 150;
export const DESCRIPTION_MAX = 160;

/** First form that fits 60 characters; the last form regardless (never cut mid-word). */
export function fitTitle(forms: readonly string[]): string {
  return forms.find((f) => f.length <= TITLE_MAX) ?? forms[forms.length - 1] ?? "";
}

/** `"{title} — Astrologer Kavita"` shortened step by step until it fits. */
export function pageTitle(title: string): string {
  return fitTitle([`${title} — ${BRAND}`, `${title} — Kavita`, title]);
}

/**
 * Cut a generated description to 150–160 characters at a sentence end where one falls in
 * range, else at a word boundary with an ellipsis. Hand-written descriptions pass through.
 */
export function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_MAX) return clean;
  const window = clean.slice(0, DESCRIPTION_MAX);
  const sentenceEnd = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf(".", DESCRIPTION_MAX - 1),
  );
  if (sentenceEnd + 1 >= DESCRIPTION_MIN) return window.slice(0, sentenceEnd + 1);
  const cut = clean.slice(0, DESCRIPTION_MAX - 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > DESCRIPTION_MIN - 10 ? space : DESCRIPTION_MAX - 1).replace(/[,;:]$/, "")}…`;
}

export interface LearnMetadataInput {
  title: string;
  description: string;
  path: string;
  siteUrl: string;
  ogKind?: "astrologer" | "vastu";
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/** Title ≤ 60, description 150–160, absolute canonical and the on-brand OG image (§8). */
export function learnMetadata(input: LearnMetadataInput): Metadata {
  const title = pageTitle(input.title);
  const description = fitDescription(input.description);
  const canonical = `${input.siteUrl}${input.path}`;
  const params = new URLSearchParams({
    title: input.title,
    subtitle: "Learn · Vedic astrology & vastu",
    kind: input.ogKind ?? "astrologer",
  });
  const image = `${input.siteUrl}/api/og?${params.toString()}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: input.type ?? "website",
      url: canonical,
      siteName: BRAND,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${input.title} — ${BRAND}` }],
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
