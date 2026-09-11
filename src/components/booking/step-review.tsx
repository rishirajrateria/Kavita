import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BOOK_MODE_STEP,
  BOOK_NAV,
  BOOK_REVIEW_STEP,
  BOOK_DETAILS_STEP,
} from "@/content/pages/book";
import { dualZoneParts, formatInZone, zoneAbbreviation } from "@/lib/booking/format";
import { needsBirth, needsProperty } from "./api";
import type { StepIndex } from "./state";
import type { BookableService, BookingMode, DetailsState, Slot } from "./types";

const L = BOOK_REVIEW_STEP.labels;

export interface StepReviewProps {
  service: BookableService;
  mode: BookingMode;
  slot: Slot;
  clientTz: string;
  practitionerTz: string;
  details: DetailsState;
  question: string;
  onEdit: (step: StepIndex) => void;
}

interface Row {
  label: string;
  value: React.ReactNode;
  step: StepIndex;
}

/** Step 6: everything on one parchment card, each row with a "Change" link back to its step. */
export function StepReview(props: StepReviewProps) {
  const { service, mode, slot, clientTz, practitionerTz, details: d, question } = props;
  const parts = dualZoneParts(slot.startsAt, clientTz, practitionerTz);
  const dial = d.dialCode === "other" ? d.customDialCode : d.dialCode;
  const phone = d.phone.trim() ? `${dial} ${d.phone.trim()}` : L.notGiven;

  const rows: Row[] = [
    { label: L.service, value: service.name, step: 0 },
    { label: L.mode, value: BOOK_MODE_STEP.modes[mode].label, step: 1 },
    {
      label: L.time,
      value: (
        <span className="flex flex-col gap-0.5">
          <span>
            {formatInZone(slot.startsAt, clientTz, "long-date")}, {parts.clientTime}{" "}
            {parts.clientZone}
            <span className="text-muted-foreground"> — in your time zone</span>
          </span>
          {parts.practitionerTime !== null ? (
            <span className="text-sm text-muted-foreground">
              {formatInZone(slot.startsAt, practitionerTz, "weekday-date")},{" "}
              {parts.practitionerTime} {parts.practitionerZone} — in Astrologer Kavita&rsquo;s
            </span>
          ) : null}
        </span>
      ),
      step: 2,
    },
    { label: L.name, value: d.name, step: 3 },
    { label: L.email, value: d.email, step: 3 },
    { label: L.phone, value: phone, step: 3 },
  ];
  if (needsBirth(service)) {
    rows.push({
      label: L.birth,
      value: BOOK_REVIEW_STEP.birthSummary(
        d.birthDate,
        d.birthTimeAccuracy === "unknown" ? null : d.birthTime || null,
        d.birthPlace,
      ),
      step: 3,
    });
  }
  if (needsProperty(service)) {
    const type = d.propertyType
      ? BOOK_DETAILS_STEP.property.typeOptions[d.propertyType]
      : L.notGiven;
    rows.push({
      label: L.property,
      value: d.entranceFacing.trim() ? `${type} · entrance ${d.entranceFacing.trim()}` : type,
      step: 3,
    });
    rows.push({ label: L.floorPlan, value: d.floorPlan ? L.attached : L.toFollow, step: 3 });
  }
  rows.push({ label: L.question, value: question.trim() || L.notGiven, step: 4 });

  return (
    <div className="max-w-[44rem]">
      <dl className="divide-y divide-accent-border/40 rounded-xl border border-accent-border/40 bg-surface-muted">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-start sm:gap-4"
          >
            <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase sm:pt-1">
              {row.label}
            </dt>
            <dd className="min-w-0 font-serif text-lg leading-snug break-words text-foreground">
              {row.value}
            </dd>
            <dd className="sm:text-right">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 sm:px-2"
                onClick={() => props.onEdit(row.step)}
                aria-label={`${BOOK_NAV.edit} ${row.label.toLowerCase()}`}
              >
                {BOOK_NAV.edit}
              </Button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        {BOOK_REVIEW_STEP.terms}{" "}
        <Link href="/terms" className="text-accent-strong">
          {BOOK_REVIEW_STEP.termsLink}
        </Link>
        {" · "}
        <Link href="/privacy" className="text-accent-strong">
          {BOOK_REVIEW_STEP.privacyLink}
        </Link>
        <span className="sr-only">
          . Times are shown in {zoneAbbreviation(clientTz, slot.startsAt)}.
        </span>
      </p>
    </div>
  );
}
