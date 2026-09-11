import type { BookingStatus } from "@/db/schema";
import type { ResearchStatus } from "@/content/locations/schema";
import { cn } from "@/lib/utils";

const BOOKING_TONE: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning-soft text-warning" },
  confirmed: { label: "Confirmed", className: "bg-success-soft text-success" },
  awaiting_payment: { label: "Awaiting payment", className: "bg-warning-soft text-warning" },
  paid: { label: "Paid", className: "bg-success-soft text-success" },
  payment_pending_offline: { label: "Pay offline", className: "bg-info-soft text-info" },
  rescheduled: { label: "Rescheduled", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-error-soft text-error" },
  completed: { label: "Completed", className: "bg-accent text-accent-foreground" },
  no_show: { label: "No-show", className: "bg-error-soft text-error" },
};

export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_TONE[status].label;
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const tone = BOOKING_TONE[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide whitespace-nowrap uppercase",
        tone.className,
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {tone.label}
    </span>
  );
}

const RESEARCH_TONE: Record<ResearchStatus, { label: string; className: string; hint: string }> = {
  complete: {
    label: "Complete",
    className: "bg-success-soft text-success",
    hint: "Indexable and in the sitemap",
  },
  partial: {
    label: "Partial",
    className: "bg-warning-soft text-warning",
    hint: "Renders with noindex until client concerns are added",
  },
  stub: {
    label: "Stub",
    className: "bg-muted text-muted-foreground",
    hint: "No research: the page does not exist",
  },
};

export function ResearchStatusBadge({ status }: { status: ResearchStatus }) {
  const tone = RESEARCH_TONE[status];
  return (
    <span
      title={tone.hint}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
        tone.className,
      )}
    >
      {tone.label}
    </span>
  );
}

/** Generic on/off pill for boolean columns in tables. */
export function BoolBadge({
  value,
  on = "Yes",
  off = "No",
}: {
  value: boolean;
  on?: string;
  off?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
        value ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {value ? on : off}
    </span>
  );
}
