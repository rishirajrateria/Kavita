"use client";

/**
 * Admin actions on one booking: confirm / complete / no-show (one click), cancel (reason,
 * confirm dialog) and reschedule (date-time in the admin's browser zone, converted to an instant).
 * Every button posts through `ActionForm` to `POST /api/admin/bookings/[id]`.
 */
import { useState } from "react";
import type { BookingStatus } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "./action-form";

const ACTIVE: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "awaiting_payment",
  "paid",
  "payment_pending_offline",
];
const CONFIRMABLE: readonly BookingStatus[] = [
  "pending",
  "awaiting_payment",
  "payment_pending_offline",
];

export function BookingActions({
  bookingId,
  status,
  canEdit,
  disabled,
}: {
  bookingId: string;
  status: BookingStatus;
  /** Editor or owner. Viewers see the buttons disabled with an explanation. */
  canEdit: boolean;
  /** No database: buttons render but cannot act. */
  disabled?: boolean;
}) {
  const [panel, setPanel] = useState<"none" | "cancel" | "reschedule">("none");
  const endpoint = `/api/admin/bookings/${bookingId}`;
  const active = ACTIVE.includes(status);
  const off = disabled || !canEdit;
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        This booking is {status.replace(/_/g, " ")}; no further actions apply.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CONFIRMABLE.includes(status) ? (
          <ActionForm
            action={endpoint}
            payload={{ action: "confirm" }}
            submitLabel="Confirm"
            variant="gold"
            size="sm"
            inline
            disabled={off}
            successMessage="Confirmed."
          />
        ) : null}
        <button
          type="button"
          onClick={() => setPanel(panel === "reschedule" ? "none" : "reschedule")}
          disabled={off}
          aria-expanded={panel === "reschedule"}
          className="inline-flex h-8 items-center rounded-md border border-accent-border bg-transparent px-3 text-sm font-medium text-accent-strong hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          Reschedule
        </button>
        <ActionForm
          action={endpoint}
          payload={{ action: "complete" }}
          submitLabel="Mark completed"
          variant="outline"
          size="sm"
          inline
          disabled={off}
          successMessage="Marked completed."
        />
        <ActionForm
          action={endpoint}
          payload={{ action: "no_show" }}
          submitLabel="No-show"
          variant="outline"
          size="sm"
          inline
          disabled={off}
          confirm="Mark this booking as a no-show?"
          successMessage="Marked no-show."
        />
        <button
          type="button"
          onClick={() => setPanel(panel === "cancel" ? "none" : "cancel")}
          disabled={off}
          aria-expanded={panel === "cancel"}
          className="inline-flex h-8 items-center rounded-md border border-error/40 bg-transparent px-3 text-sm font-medium text-error hover:bg-error-soft disabled:pointer-events-none disabled:opacity-50"
        >
          Cancel booking
        </button>
      </div>
      {!canEdit ? (
        <p className="text-xs text-muted-foreground">
          Viewers can read bookings but not change them.
        </p>
      ) : null}

      {panel === "reschedule" ? (
        <ActionForm
          action={endpoint}
          payload={{ action: "reschedule" }}
          submitLabel="Move booking"
          variant="gold"
          size="sm"
          disabled={off}
          successMessage="Rescheduled — the client has been sent the new time."
          className="rounded-md border border-border bg-background/60 p-4"
        >
          <RescheduleFields browserZone={browserZone} />
        </ActionForm>
      ) : null}

      {panel === "cancel" ? (
        <ActionForm
          action={endpoint}
          payload={{ action: "cancel" }}
          submitLabel="Cancel this booking"
          variant="destructive"
          size="sm"
          disabled={off}
          confirm="Cancel this booking? The client will be told the reason you enter."
          successMessage="Cancelled."
          className="rounded-md border border-error/30 bg-error-soft/40 p-4"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Reason (sent to the client)
            <Textarea
              name="reason"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              placeholder="e.g. Kavita is unwell; please rebook with the link below."
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="hidden" name="notifyClient" value="off" />
            <input
              type="checkbox"
              name="notifyClient"
              value="on"
              defaultChecked
              className="size-4 accent-[var(--accent-strong)]"
            />
            Email the client
          </label>
        </ActionForm>
      ) : null}
    </div>
  );
}

function RescheduleFields({ browserZone }: { browserZone: string }) {
  const [local, setLocal] = useState("");
  const instant = local ? new Date(local) : null;
  const iso = instant && !Number.isNaN(instant.getTime()) ? instant.toISOString() : "";
  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        New start time{" "}
        <span className="font-normal text-muted-foreground">
          (in your browser&apos;s zone, {browserZone})
        </span>
        <Input
          type="datetime-local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          required
          step={300}
          className="max-w-xs"
        />
      </label>
      <input type="hidden" name="startsAt" value={iso} />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="notifyClient" value="off" />
        <input
          type="checkbox"
          name="notifyClient"
          value="on"
          defaultChecked
          className="size-4 accent-[var(--accent-strong)]"
        />
        Email the client the new time
      </label>
      <p className="text-xs text-muted-foreground">
        The slot must be free under the availability rules; if it is not, the nearest free slots are
        returned.
      </p>
    </>
  );
}

export function BookingNoteForm({
  bookingId,
  disabled,
}: {
  bookingId: string;
  disabled?: boolean;
}) {
  return (
    <ActionForm
      action={`/api/admin/bookings/${bookingId}/notes`}
      submitLabel="Add note"
      variant="gold-outline"
      size="sm"
      disabled={disabled}
      successMessage="Note added."
    >
      <Textarea
        name="body"
        required
        maxLength={4000}
        rows={3}
        placeholder="Internal note — never shown to the client."
      />
    </ActionForm>
  );
}
