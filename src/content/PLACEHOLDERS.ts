/**
 * Clearly-marked placeholder content (CLAUDE.md §12). These rows are NEVER seeded into the
 * database; they only back the no-database fallback so components can be built and previewed.
 * The Phase 2 build gate fails any production build in which `PLACEHOLDER_MARKER` (or any
 * `{{PLACEHOLDER}}`) reaches rendered output.
 */
import type { Testimonial } from "@/db/schema";
import { hydrate, type SeedRow } from "./seed/_shared";

/** Substring the build gate searches rendered HTML for. Uses the `{{…}}` placeholder convention. */
export const PLACEHOLDER_MARKER = "{{PLACEHOLDER_TESTIMONIAL}}";

export const PLACEHOLDER_CLIENT_NAME = "Placeholder client — replace before launch";

const placeholder = (key: string, quote: string): Testimonial =>
  hydrate<Testimonial>("placeholder-testimonials", key, {
    clientName: PLACEHOLDER_CLIENT_NAME,
    clientLocationId: null,
    serviceId: null,
    quote: `${PLACEHOLDER_MARKER} ${quote}`,
    rating: null,
    date: null,
    source: "other",
    consentGiven: false,
    isPublished: false,
    isPlaceholder: true,
  } satisfies SeedRow<Testimonial>);

export const PLACEHOLDER_TESTIMONIALS: readonly Testimonial[] = [
  placeholder(
    "one",
    "This is placeholder copy standing in for a real, consented client testimonial. It exists only so the testimonial component can be designed; it must be replaced before launch.",
  ),
  placeholder(
    "two",
    "Placeholder testimonial text. No client said this. Replace with genuine, attributable client feedback for which explicit permission to publish has been given.",
  ),
  placeholder(
    "three",
    "Placeholder testimonial text for layout purposes only. The production build gate blocks deployment while this text is present anywhere in rendered output.",
  ),
];
