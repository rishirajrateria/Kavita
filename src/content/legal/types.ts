/**
 * Typed model for the legal pages (`/privacy`, `/terms`, `/disclaimer`). Copy lives here as
 * data — not in components — so the admin (Phase 5) can move it to the database without
 * touching layout. Everything renders server-side as plain HTML.
 *
 * Inline links inside any text use the minimal `[label](/path)` form, rendered by
 * `src/components/legal/rich-text.tsx`; nothing else is interpreted.
 */

export type LegalBlock =
  | { readonly type: "p"; readonly text: string }
  | { readonly type: "h3"; readonly text: string }
  | { readonly type: "ul"; readonly items: readonly string[] }
  | { readonly type: "ol"; readonly items: readonly string[] }
  | {
      readonly type: "dl";
      readonly rows: readonly { readonly term: string; readonly detail: string }[];
    }
  | {
      readonly type: "table";
      readonly caption?: string;
      readonly columns: readonly string[];
      readonly rows: readonly (readonly string[])[];
    }
  | { readonly type: "note"; readonly text: string };

export interface LegalSection {
  /** URL fragment and TOC anchor; stable once published (the footer links `/privacy#consent`). */
  readonly id: string;
  /** H2 text — a real question where one reads naturally (CLAUDE.md §9.2). */
  readonly heading: string;
  /** Short label for the "On this page" list; defaults to the heading. */
  readonly tocLabel?: string;
  /** Optional 40–60 word self-contained answer rendered as `<p class="answer">`. */
  readonly answer?: string;
  readonly blocks: readonly LegalBlock[];
}

export interface LegalDocument {
  readonly slug: "privacy" | "terms" | "disclaimer";
  readonly eyebrow: string;
  readonly title: string;
  /** ≤ 60 characters (CLAUDE.md §8). */
  readonly metaTitle: string;
  /** 150–160 characters (CLAUDE.md §8). */
  readonly metaDescription: string;
  readonly lede: string;
  /** `YYYY-MM-DD`; bump in `src/content/route-dates.ts` in the same change. */
  readonly datePublished: string;
  readonly dateModified: string;
  /** Internal version stamped into `consent_log.policy_version` (privacy only). */
  readonly version: string;
  readonly sections: readonly LegalSection[];
}

/** Values every legal document may interpolate; all placeholder-safe strings. */
export interface LegalContext {
  readonly brandName: string;
  /** The controller / contracting party, e.g. a sole proprietorship or company name. */
  readonly legalEntity: string;
  readonly practitionerName: string;
  readonly email: string;
  /** "City, Country" of the practitioner. */
  readonly basedIn: string;
  readonly timezone: string;
  /** Human labels of the third-party tags currently enabled; empty when none are. */
  readonly enabledIntegrations: readonly string[];
}

/** Placeholders introduced by the legal pages; each is listed in NEEDS-REAL-DATA.md ("Legal"). */
export const LEGAL_PLACEHOLDERS = {
  retentionContactMonths: "{{RETENTION_CONTACT_MONTHS}}",
  retentionBookingYears: "{{RETENTION_BOOKING_YEARS}}",
  retentionTestimonialUnpublishedMonths: "{{RETENTION_TESTIMONIAL_UNPUBLISHED_MONTHS}}",
  hostingRegion: "{{HOSTING_REGION}}",
  rescheduleNoticeHours: "{{RESCHEDULE_NOTICE_HOURS}}",
  cancellationPolicy: "{{CANCELLATION_POLICY}}",
  refundPolicy: "{{REFUND_POLICY}}",
  governingLaw: "{{GOVERNING_LAW_JURISDICTION}}",
  privacyContactEmail: "{{PRIVACY_CONTACT_EMAIL}}",
} as const;

/** "24 hours ({{X}} — to confirm)": a sensible default the owner must confirm or replace. */
export function toConfirm(defaultValue: string, placeholder: string): string {
  return `${defaultValue} (${placeholder} — to confirm)`;
}
