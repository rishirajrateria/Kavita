"use client";

/**
 * Self-service island on `/booking/[token]`: reschedule (the month grid and slot list from
 * the booking flow, reused as-is) and cancel behind a native `<dialog>` confirmation.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Heading } from "@/components/ui/heading";
import { Textarea } from "@/components/ui/textarea";
import { BOOK_ERRORS, BOOK_TIME_STEP, MANAGE_PAGE } from "@/content/pages/book";
import { dateKeyInZone, dualZoneLabel, monthKeyOf } from "@/lib/booking/format";
import { MonthGrid } from "./month-grid";
import { SlotList } from "./slot-list";
import type { Slot } from "./types";
import { useAvailability } from "./use-availability";

export interface ManageBookingProps {
  token: string;
  serviceSlug: string;
  clientTz: string;
  practitionerTz: string;
  canReschedule: boolean;
  canCancel: boolean;
  noticeHours: number;
  initialMonth: string;
  maxMonth: string;
  now: string;
}

type Outcome = { tone: "success" | "error" | "warn"; text: string } | null;

async function post(url: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      reason?: string;
      token?: string;
      manageToken?: string;
      booking?: { manageToken?: string };
      alternatives?: Slot[];
    } | null;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

function failureText(status: number, reason: string | undefined, noticeHours: number): string {
  if (status === 503 || reason === "not_connected") return MANAGE_PAGE.notConnected.body;
  if (status === 429 || reason === "rate_limited") return BOOK_ERRORS.rateLimited;
  if (reason === "notice_period") return MANAGE_PAGE.reschedule.tooLate(noticeHours);
  if (reason === "slot_taken" || reason === "slot_unavailable") return BOOK_ERRORS.slotGone;
  if (reason === "invalid_token" || reason === "expired" || reason === "not_found")
    return MANAGE_PAGE.invalid.body;
  if (status === 0) return BOOK_ERRORS.network;
  return BOOK_ERRORS.server;
}

export function ManageBooking(props: ManageBookingProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(props.initialMonth);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState<"move" | "cancel" | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [reason, setReason] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const availability = useAvailability(props.serviceSlug, month, props.clientTz, open);
  const available = new Set(availability.days.keys());

  async function move() {
    if (!slot) return;
    setBusy("move");
    setOutcome(null);
    const { status, data } = await post(
      `/api/bookings/${encodeURIComponent(props.token)}/reschedule`,
      {
        startsAt: slot.startsAt,
        clientTimezone: props.clientTz,
      },
    );
    setBusy(null);
    if (data?.ok) {
      const token = data.token ?? data.manageToken ?? data.booking?.manageToken;
      setOutcome({ tone: "success", text: MANAGE_PAGE.reschedule.moved });
      setOpen(false);
      if (token && token !== props.token)
        router.replace(`/booking/${encodeURIComponent(token)}?moved=1`);
      else router.refresh();
      return;
    }
    if (data?.reason === "slot_taken" || data?.reason === "slot_unavailable") {
      setSlot(null);
      availability.reload();
    }
    setOutcome({ tone: "error", text: failureText(status, data?.reason, props.noticeHours) });
  }

  async function cancel() {
    setBusy("cancel");
    setOutcome(null);
    const { status, data } = await post(`/api/bookings/${encodeURIComponent(props.token)}/cancel`, {
      reason: reason.trim() || undefined,
    });
    setBusy(null);
    dialog.current?.close();
    if (data?.ok) {
      setOutcome({ tone: "success", text: MANAGE_PAGE.cancel.cancelled });
      router.refresh();
      return;
    }
    setOutcome({ tone: "error", text: failureText(status, data?.reason, props.noticeHours) });
  }

  return (
    <div className="space-y-10">
      {outcome ? (
        <Callout variant={outcome.tone} role="status">
          {outcome.text}
        </Callout>
      ) : null}

      <section aria-labelledby="reschedule-heading" className="space-y-4">
        <Heading as="h2" level={3} id="reschedule-heading">
          {MANAGE_PAGE.reschedule.heading}
        </Heading>
        {props.canReschedule ? (
          <>
            <p className="max-w-prose text-muted-foreground">
              {MANAGE_PAGE.reschedule.intro(props.noticeHours)}
            </p>
            {!open ? (
              <Button type="button" variant="gold" size="lg" onClick={() => setOpen(true)}>
                {MANAGE_PAGE.reschedule.button}
              </Button>
            ) : (
              <div className="glass space-y-6 p-5 sm:p-8">
                {availability.status === "error" ? (
                  <Callout variant="error" title={BOOK_TIME_STEP.loadFailed}>
                    <Button
                      type="button"
                      variant="gold-outline"
                      size="sm"
                      onClick={availability.reload}
                      className="mt-2"
                    >
                      {BOOK_TIME_STEP.retry}
                    </Button>
                  </Callout>
                ) : null}
                <div className="grid gap-8 lg:grid-cols-[26rem_1fr] lg:gap-12">
                  <MonthGrid
                    month={month}
                    available={available}
                    selected={day}
                    todayKey={dateKeyInZone(props.now, props.clientTz)}
                    minMonth={monthKeyOf(dateKeyInZone(props.now, props.clientTz))}
                    maxMonth={props.maxMonth}
                    loading={availability.status === "loading"}
                    onSelect={(d) => {
                      setDay(d);
                      setSlot(null);
                    }}
                    onMonthChange={setMonth}
                  />
                  <SlotList
                    day={day}
                    slots={day ? (availability.days.get(day) ?? []) : []}
                    selected={slot}
                    clientTz={props.clientTz}
                    practitionerTz={props.practitionerTz}
                    onSelect={setSlot}
                  />
                </div>
                <p className="min-h-6 text-sm font-medium" aria-live="polite">
                  {slot
                    ? BOOK_TIME_STEP.selected(
                        dualZoneLabel(slot.startsAt, props.clientTz, props.practitionerTz),
                      )
                    : ""}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    disabled={!slot || busy !== null}
                    onClick={move}
                  >
                    {busy === "move"
                      ? MANAGE_PAGE.reschedule.moving
                      : MANAGE_PAGE.reschedule.confirm}
                  </Button>
                  <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)}>
                    {MANAGE_PAGE.cancel.keep}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="max-w-prose text-muted-foreground">
            {MANAGE_PAGE.reschedule.tooLate(props.noticeHours)}
          </p>
        )}
      </section>

      <section
        aria-labelledby="cancel-heading"
        className="space-y-4 border-t border-accent-border/30 pt-8"
      >
        <Heading as="h2" level={3} id="cancel-heading">
          {MANAGE_PAGE.cancel.heading}
        </Heading>
        {props.canCancel ? (
          <>
            <p className="max-w-prose text-muted-foreground">
              {MANAGE_PAGE.cancel.intro(props.noticeHours)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => dialog.current?.showModal()}
            >
              {MANAGE_PAGE.cancel.button}
            </Button>
            <dialog
              ref={dialog}
              aria-labelledby="cancel-dialog-title"
              /* Opaque popover, not glass: a confirmation you cannot misread beats atmosphere.
                 The scrim reads --surface-inverse-deep so it stays a dark veil in both palettes
                 (bg-indigo-950/60 was a primitive ramp and only happened to work). */
              className="m-auto w-[min(92vw,28rem)] rounded-xl border border-accent-border/40 bg-popover p-6 text-popover-foreground shadow-xl backdrop:bg-surface-inverse-deep/70 sm:p-8"
            >
              <Heading as="h3" level={3} id="cancel-dialog-title">
                {MANAGE_PAGE.cancel.confirmTitle}
              </Heading>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {MANAGE_PAGE.cancel.confirmBody}
              </p>
              <label htmlFor="cancel-reason" className="mt-5 block text-sm font-medium">
                {MANAGE_PAGE.cancel.reason}
              </label>
              <Textarea
                id="cancel-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5"
              />
              <div className="mt-6 flex flex-wrap-reverse justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => dialog.current?.close()}
                >
                  {MANAGE_PAGE.cancel.keep}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  disabled={busy !== null}
                  onClick={cancel}
                >
                  {busy === "cancel" ? MANAGE_PAGE.cancel.cancelling : MANAGE_PAGE.cancel.confirm}
                </Button>
              </div>
            </dialog>
          </>
        ) : (
          <p className="max-w-prose text-muted-foreground">
            {MANAGE_PAGE.cancel.tooLate(props.noticeHours)}
          </p>
        )}
      </section>
    </div>
  );
}
