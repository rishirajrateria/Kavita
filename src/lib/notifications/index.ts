/**
 * `notify(kind, booking)` — the single entry point the booking engine and the reminder cron call.
 *
 * Fan-out per kind (email channel):
 *   confirmation  → client (`confirmation_client`) + practitioner (`confirmation_practitioner`)
 *   reminder_24h  → client
 *   reminder_1h   → client
 *   reschedule    → client + practitioner (`reschedule`)
 *   cancellation  → client + practitioner (`cancellation`)
 *
 * Idempotency: every message claims `notification_log.dedupe_key` before sending
 * (`${bookingId}:${logKind}:${channel}`, plus `:practitioner` where the log enum does not split
 * the recipient). With no database the ledger is process-local. A failed send is recorded on the
 * row and never thrown: a notification must not break the booking path that fired it.
 */
import { getDb } from "@/db";
// Phase 5 (P5-C): admin-editable subject/intro overrides from `notification_templates`.
import {
  applyTemplateOverride,
  getTemplateOverride,
  templateVariables,
} from "@/lib/admin/settings";
import { realValue } from "@/lib/site";
import { getNotificationEnv } from "./env";
import { DbNotificationLog, MemoryNotificationLog, type NotificationLog } from "./log";
import { getEmailProvider, getWhatsAppProvider, redactEmail } from "./providers";
import { renderNotificationEmail } from "./render";
import type {
  BookingWithRelations,
  EmailProvider,
  NotificationKind,
  NotificationLogKind,
  NotificationRecipient,
  NotifyOutcome,
  WhatsAppProvider,
} from "./types";

export type { BookingWithRelations, NotificationChannel, NotificationKind } from "./types";
export { buildEmailModel, DISCLAIMER_LINE } from "./model";
export { renderNotificationEmail } from "./render";
export { MemoryNotificationLog } from "./log";
export { NoopEmailProvider, NoopWhatsAppProvider } from "./providers";

export interface NotifierDeps {
  email: EmailProvider;
  whatsapp: WhatsAppProvider | null;
  log: NotificationLog;
  /** Practitioner inbox; `null` = no practitioner copies (address still a placeholder). */
  practitionerEmail: string | null;
}

interface Plan {
  recipient: NotificationRecipient;
  logKind: NotificationLogKind;
  keySuffix: string;
}

function plan(kind: NotificationKind): Plan[] {
  switch (kind) {
    case "confirmation":
      return [
        { recipient: "client", logKind: "confirmation_client", keySuffix: "" },
        { recipient: "practitioner", logKind: "confirmation_practitioner", keySuffix: "" },
      ];
    case "reminder_24h":
    case "reminder_1h":
      return [{ recipient: "client", logKind: kind, keySuffix: "" }];
    case "reschedule":
    case "cancellation":
      return [
        { recipient: "client", logKind: kind, keySuffix: "" },
        { recipient: "practitioner", logKind: kind, keySuffix: ":practitioner" },
      ];
  }
}

export function dedupeKey(
  bookingId: string,
  logKind: NotificationLogKind,
  channel: "email" | "whatsapp",
  suffix = "",
): string {
  return `${bookingId}:${logKind}:${channel}${suffix}`;
}

function errorLabel(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : "unknown error";
}

export function createNotifier(deps: NotifierDeps) {
  async function sendEmail(
    kind: NotificationKind,
    step: Plan,
    data: BookingWithRelations,
    outcome: NotifyOutcome,
  ): Promise<void> {
    const to = step.recipient === "client" ? data.client.email : deps.practitionerEmail;
    if (!to) {
      outcome.skipped += 1;
      return;
    }
    const bookingId = data.booking.id;
    const claim = await deps.log.claim({
      bookingId,
      kind: step.logKind,
      channel: "email",
      dedupeKey: dedupeKey(bookingId, step.logKind, "email", step.keySuffix),
    });
    if (!claim) {
      outcome.skipped += 1;
      return;
    }
    try {
      // Phase 5 (P5-C): an admin override replaces the subject and/or prepends an intro; with
      // no database or no row this is a no-op. Never throws.
      const rendered = applyTemplateOverride(
        await renderNotificationEmail(kind, step.recipient, data),
        await getTemplateOverride(kind, step.recipient),
        templateVariables(data),
      );
      const result = await deps.email.send({
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        ...(step.recipient === "practitioner" ? { replyTo: data.client.email } : {}),
      });
      await deps.log.markSent(claim.id, result.providerRef);
      outcome.sent += 1;
    } catch (error) {
      outcome.failed += 1;
      await deps.log.markFailed(claim.id, errorLabel(error)).catch(() => undefined);
      console.error(
        `[notifications] ${kind}/${step.recipient} email failed for ${redactEmail(to)}: ${
          error instanceof Error ? error.name : "unknown error"
        }`,
      );
    }
  }

  async function sendWhatsApp(
    kind: NotificationKind,
    data: BookingWithRelations,
    outcome: NotifyOutcome,
  ): Promise<void> {
    const provider = deps.whatsapp;
    const to = data.client.phone;
    if (!provider || !to) return;
    const logKind: NotificationLogKind = kind === "confirmation" ? "confirmation_client" : kind;
    const bookingId = data.booking.id;
    const claim = await deps.log.claim({
      bookingId,
      kind: logKind,
      channel: "whatsapp",
      dedupeKey: dedupeKey(bookingId, logKind, "whatsapp"),
    });
    if (!claim) {
      outcome.skipped += 1;
      return;
    }
    try {
      const rendered = await renderNotificationEmail(kind, "client", data);
      const result = await provider.send({ to, text: `${rendered.subject}\n\n${rendered.text}` });
      await deps.log.markSent(claim.id, result.providerRef);
      outcome.sent += 1;
    } catch (error) {
      outcome.failed += 1;
      await deps.log.markFailed(claim.id, errorLabel(error)).catch(() => undefined);
    }
  }

  return async function notify(
    kind: NotificationKind,
    data: BookingWithRelations,
  ): Promise<NotifyOutcome> {
    const outcome: NotifyOutcome = { sent: 0, skipped: 0, failed: 0 };
    for (const step of plan(kind)) await sendEmail(kind, step, data, outcome);
    await sendWhatsApp(kind, data, outcome);
    return outcome;
  };
}

let memoryLog: MemoryNotificationLog | undefined;

function resolveDeps(data: BookingWithRelations): NotifierDeps {
  const db = getDb();
  const log: NotificationLog = db
    ? new DbNotificationLog(db)
    : (memoryLog ??= new MemoryNotificationLog());
  const env = getNotificationEnv();
  return {
    email: getEmailProvider(),
    whatsapp: getWhatsAppProvider(),
    log,
    practitionerEmail: env.EMAIL_NOTIFY_TO ?? realValue(data.settings.email) ?? null,
  };
}

/**
 * Send every message `kind` implies for `booking`. Never throws. Returns counts so the cron
 * route can report `{ sent, skipped }`; callers on the booking path may ignore the result.
 */
export async function notify(
  kind: NotificationKind,
  data: BookingWithRelations,
): Promise<NotifyOutcome> {
  try {
    // The practitioner address may come from settings, so the notifier is built per call; the
    // providers and the in-memory ledger behind it are process singletons.
    return await createNotifier(resolveDeps(data))(kind, data);
  } catch (error) {
    console.error(`[notifications] ${kind} failed: ${errorLabel(error).split(":")[0]}`);
    return { sent: 0, skipped: 0, failed: 1 };
  }
}
