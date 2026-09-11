/**
 * Per-service long copy for `/services/[slug]` (CLAUDE.md §5, §9, §12), keyed by slug. Written
 * to be honest and specific: every Sanskrit term is defined on first use on the page, no
 * outcome is promised, no number or credential is stated. Each `answer` is a 40–60 word
 * self-contained paragraph naming "Astrologer Kavita" (§9.2); `tests/forms` does not check
 * this, `scripts` may in a later phase — keep to it by hand.
 */
import { ASTROLOGY_DETAILS } from "./service-details/astrology";
import { INTEGRATED_DETAILS } from "./service-details/integrated";
import type { DetailSection, ServiceDetail } from "./service-details/types";
import { VASTU_DETAILS } from "./service-details/vastu";

export type { DetailSection, PrepareTable, ServiceDetail } from "./service-details/types";

export const SERVICE_DETAILS: readonly ServiceDetail[] = [
  ...INTEGRATED_DETAILS,
  ...ASTROLOGY_DETAILS,
  ...VASTU_DETAILS,
];

const BY_SLUG = new Map(SERVICE_DETAILS.map((d) => [d.slug, d]));

export function getServiceDetail(slug: string): ServiceDetail | undefined {
  return BY_SLUG.get(slug);
}

/** The six question sections of a service page, in page order, with their anchor ids. */
export function detailSections(
  detail: ServiceDetail,
): readonly { id: string; section: DetailSection }[] {
  return [
    { id: "what-it-is", section: detail.whatItIs },
    { id: "who-it-is-for", section: detail.whoItIsFor },
    { id: "what-is-included", section: detail.whatIsIncluded },
    { id: "what-to-prepare", section: detail.whatToPrepare },
    { id: "what-you-receive", section: detail.whatYouReceive },
    { id: "how-it-fits", section: detail.howItFits },
  ];
}
