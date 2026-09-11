/**
 * Server-rendered booking detail. Birth details arrive already decided by role (`BookingDetail`
 * from `src/lib/admin/bookings.ts`); this component never sees ciphertext.
 */
import Link from "next/link";
import type { AdminRole } from "@/db/schema";
import type { BookingDetail } from "@/lib/admin/bookings";
import { describeInZone } from "@/lib/booking/ics";
import { BookingActions, BookingNoteForm } from "./booking-actions";
import { Fact, Panel } from "./panel";
import { BookingStatusBadge, bookingStatusLabel } from "./status-badge";
import { MODE_LABEL, bookingRef, fmtDateTime, money } from "./format";

export function BookingDetailView({
  detail,
  role,
  offline,
}: {
  detail: BookingDetail;
  role: AdminRole;
  /** Preview / no database: actions render disabled. */
  offline?: boolean;
}) {
  const { booking, service, settings } = detail.relations;
  const client = detail.client;
  const canEdit = role !== "viewer";
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Panel
          title="Appointment"
          description={`Reference ${bookingRef(booking.id)}`}
          actions={<BookingStatusBadge status={booking.status} />}
        >
          <dl className="divide-y divide-border/70">
            <Fact label="Service">
              {service.name}
              <span className="text-muted-foreground">
                {" "}
                · {service.durationMinutes} min · {MODE_LABEL[booking.mode]}
              </span>
            </Fact>
            <Fact label="Practitioner time">
              {describeInZone(booking.startsAt, settings.timezone)}
            </Fact>
            <Fact label="Client time">
              {describeInZone(booking.startsAt, booking.clientTimezone)}
            </Fact>
            {booking.rescheduledFromId ? (
              <Fact label="Rescheduled from">
                <Link
                  href={`/admin/bookings/${booking.rescheduledFromId}`}
                  className="text-accent-strong underline-offset-4 hover:underline"
                >
                  {bookingRef(booking.rescheduledFromId)}
                </Link>
              </Fact>
            ) : null}
            {detail.payments.length ? (
              <Fact label="Payment">
                {detail.payments
                  .map((p) => `${money(p.amountMinor, p.currency)} · ${p.provider} · ${p.status}`)
                  .join("; ")}
              </Fact>
            ) : null}
            <Fact label="Booked">
              {fmtDateTime(booking.createdAt, settings.timezone)} ({settings.timezone})
            </Fact>
          </dl>
        </Panel>

        <Panel
          title="Actions"
          description="Every change is written to the audit log and the booking's status history."
        >
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            canEdit={canEdit}
            disabled={offline}
          />
        </Panel>

        <Panel
          title="What the client wrote"
          description="Question and intake facts from the booking form."
        >
          {booking.clientNotes ? (
            <p className="text-sm whitespace-pre-line">{booking.clientNotes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No question was entered.</p>
          )}
        </Panel>

        <Panel
          title="Internal notes"
          description="Visible to admins only; never emailed or shown to the client."
        >
          {detail.notes.length ? (
            <ol className="mb-4 flex flex-col gap-3">
              {detail.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm"
                >
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtDateTime(n.createdAt, settings.timezone)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">No notes yet.</p>
          )}
          {canEdit ? <BookingNoteForm bookingId={booking.id} disabled={offline} /> : null}
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel title="Client">
          <dl className="divide-y divide-border/70">
            <Fact label="Name">{client.fullName}</Fact>
            <Fact label="Email">
              <a
                href={`mailto:${client.email}`}
                className="text-accent-strong underline-offset-4 hover:underline"
              >
                {client.email}
              </a>
            </Fact>
            <Fact label="Phone">
              {client.phone ?? <span className="text-muted-foreground">—</span>}
            </Fact>
            <Fact label="Time zone">{client.timezone}</Fact>
            <Fact label="Language">
              {client.preferredLanguage ?? <span className="text-muted-foreground">—</span>}
            </Fact>
            <Fact label="Marketing">{client.marketingConsent ? "Consented" : "Not consented"}</Fact>
          </dl>
        </Panel>

        <Panel
          title="Birth details"
          description="Decrypted on the server for owners and editors only; never logged or emailed."
        >
          <BirthDetails view={detail.birthDetails} />
        </Panel>

        {detail.floorPlan ? (
          <Panel
            title="Floor plan"
            description="Private bucket; the link below expires in five minutes."
          >
            <p className="text-sm">
              {detail.floorPlan.plan.contentType} ·{" "}
              {(detail.floorPlan.plan.bytes / 1024).toFixed(0)} KB
            </p>
            {detail.floorPlan.signedUrl ? (
              <a
                href={detail.floorPlan.signedUrl}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-flex text-sm text-accent-strong underline-offset-4 hover:underline"
              >
                Open floor plan
              </a>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Supabase Storage is not configured, so no signed link can be issued.
              </p>
            )}
          </Panel>
        ) : null}

        <Panel title="Status history">
          <ol className="relative flex flex-col gap-3 border-l border-accent-border/50 pl-4">
            {detail.history.map((h) => (
              <li key={h.id} className="text-sm">
                <span
                  aria-hidden="true"
                  className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-accent-strong"
                />
                <p>
                  <span className="font-medium">{bookingStatusLabel(h.toStatus)}</span>
                  {h.fromStatus ? (
                    <span className="text-muted-foreground">
                      {" "}
                      from {bookingStatusLabel(h.fromStatus)}
                    </span>
                  ) : null}
                  <span className="text-muted-foreground"> · by {h.changedBy}</span>
                </p>
                {h.reason ? <p className="text-xs text-muted-foreground">{h.reason}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(h.createdAt, settings.timezone)}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function BirthDetails({ view }: { view: BookingDetail["birthDetails"] }) {
  switch (view.state) {
    case "shown":
      return (
        <dl className="divide-y divide-border/70">
          <Fact label="Date">{view.details.date}</Fact>
          <Fact label="Time">
            {view.details.time ?? <span className="text-muted-foreground">not given</span>}
            <span className="text-muted-foreground">
              {" "}
              · {view.details.timeAccuracy.replace(/_/g, " ")}
            </span>
          </Fact>
          <Fact label="Place">{view.details.place}</Fact>
        </dl>
      );
    case "restricted":
      return (
        <p className="text-sm text-muted-foreground">
          Your role (viewer) cannot see birth details.
        </p>
      );
    case "unavailable":
      return (
        <p className="text-sm text-warning">
          Stored, but the encryption key for this record is not available on this server.
        </p>
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">The client did not enter birth details.</p>
      );
  }
}
