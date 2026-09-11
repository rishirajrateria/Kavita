/**
 * kind + recipient → rendered email (subject, HTML, plain text). The only module that knows
 * which React Email template serves which message.
 */
import { render } from "@react-email/render";
import { createElement, type ReactElement } from "react";
import BookingCancelled, { subject as cancelledSubject } from "@/emails/booking-cancelled";
import BookingConfirmationClient, {
  subject as confirmationSubject,
} from "@/emails/booking-confirmation-client";
import BookingNotificationPractitioner, {
  subject as practitionerSubject,
} from "@/emails/booking-notification-practitioner";
import BookingReminder, { subject as reminderSubject } from "@/emails/booking-reminder";
import BookingRescheduled, { subject as rescheduledSubject } from "@/emails/booking-rescheduled";
import { buildEmailModel, type EmailModel } from "./model";
import type { BookingWithRelations, NotificationKind, NotificationRecipient } from "./types";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function pick(model: EmailModel): { element: ReactElement; subject: string } {
  switch (model.kind) {
    case "confirmation":
      return model.recipient === "practitioner"
        ? {
            element: createElement(BookingNotificationPractitioner, { model }),
            subject: practitionerSubject(model),
          }
        : {
            element: createElement(BookingConfirmationClient, { model }),
            subject: confirmationSubject(model),
          };
    case "reminder_24h":
      return {
        element: createElement(BookingReminder, { model, variant: "24h" }),
        subject: reminderSubject(model, "24h"),
      };
    case "reminder_1h":
      return {
        element: createElement(BookingReminder, { model, variant: "1h" }),
        subject: reminderSubject(model, "1h"),
      };
    case "reschedule":
      return {
        element: createElement(BookingRescheduled, { model }),
        subject: rescheduledSubject(model),
      };
    case "cancellation":
      return {
        element: createElement(BookingCancelled, { model }),
        subject: cancelledSubject(model),
      };
  }
}

/** Render from an already-built model (tests) … */
export async function renderEmailModel(model: EmailModel): Promise<RenderedEmail> {
  const { element, subject } = pick(model);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text };
}

/** … or straight from a booking. */
export function renderNotificationEmail(
  kind: NotificationKind,
  recipient: NotificationRecipient,
  data: BookingWithRelations,
): Promise<RenderedEmail> {
  return renderEmailModel(buildEmailModel(kind, recipient, data));
}
