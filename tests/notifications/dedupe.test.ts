import { check, equal } from "../seo-plumbing/_assert";
import { createNotifier, dedupeKey } from "@/lib/notifications";
import { MemoryNotificationLog } from "@/lib/notifications/log";
import { NoopEmailProvider, NoopWhatsAppProvider } from "@/lib/notifications/providers";
import type { EmailMessage, EmailProvider } from "@/lib/notifications/types";
import { fixture } from "./_fixtures";

export async function run() {
  const email = new NoopEmailProvider(true);
  const log = new MemoryNotificationLog();
  const notify = createNotifier({
    email,
    whatsapp: null,
    log,
    practitionerEmail: "practitioner@example.com",
  });
  const data = fixture();

  const first = await notify("confirmation", data);
  equal(first.sent, 2, "dedupe: confirmation sends client + practitioner");
  equal(first.skipped, 0, "dedupe: nothing skipped on first send");
  equal(email.sent.length, 2, "dedupe: two messages left the provider");

  const client = email.sent.find((m) => m.to === "test.client@example.com");
  const practitioner = email.sent.find((m) => m.to === "practitioner@example.com");
  check(
    client !== undefined && client.replyTo === undefined,
    "dedupe: client copy has no reply-to",
  );
  check(
    practitioner?.replyTo === "test.client@example.com",
    "dedupe: practitioner copy replies to the client",
  );
  check((practitioner?.text ?? "").includes("Birth details are in the admin"), "practitioner note");

  const again = await notify("confirmation", data);
  equal(again.sent, 0, "dedupe: repeat sends nothing");
  equal(again.skipped, 2, "dedupe: repeat is skipped for both recipients");
  equal(email.sent.length, 2, "dedupe: provider not called again");

  const keys = [...log.rows.keys()];
  check(
    keys.includes(dedupeKey(data.booking.id, "confirmation_client", "email")),
    "dedupe: client key format",
  );
  check(
    keys.includes(dedupeKey(data.booking.id, "confirmation_practitioner", "email")),
    "dedupe: practitioner key format",
  );
  check(
    [...log.rows.values()].every((r) => r.sentAt !== null && r.error === null),
    "dedupe: rows stamped sent_at without error",
  );

  // A different kind for the same booking is a new key.
  const reminder = await notify("reminder_24h", data);
  equal(reminder.sent, 1, "dedupe: reminder is sent once");
  equal((await notify("reminder_24h", data)).skipped, 1, "dedupe: reminder repeat skipped");
  equal((await notify("reminder_1h", data)).sent, 1, "dedupe: 1h reminder is a separate key");

  // Reschedule and cancellation fan out to both, with distinct keys.
  equal((await notify("reschedule", data)).sent, 2, "dedupe: reschedule → client + practitioner");
  equal((await notify("cancellation", data)).sent, 2, "dedupe: cancellation → both");
  check(
    keys.length < log.rows.size &&
      [...log.rows.keys()].includes(`${data.booking.id}:cancellation:email:practitioner`),
    "dedupe: practitioner copy keyed with suffix where the log enum has no split",
  );

  // No practitioner address (placeholder settings) → client only, practitioner skipped.
  const noInbox = createNotifier({
    email: new NoopEmailProvider(true),
    whatsapp: null,
    log: new MemoryNotificationLog(),
    practitionerEmail: null,
  });
  const partial = await noInbox("confirmation", data);
  equal(partial.sent, 1, "dedupe: no practitioner inbox → client only");
  equal(partial.skipped, 1, "dedupe: practitioner copy counted as skipped");

  // A failing provider marks the row failed and never throws.
  const failing: EmailProvider = {
    name: "failing",
    async send(_m: EmailMessage) {
      throw new Error("boom");
    },
  };
  const failLog = new MemoryNotificationLog();
  const failNotify = createNotifier({
    email: failing,
    whatsapp: null,
    log: failLog,
    practitionerEmail: null,
  });
  const failed = await failNotify("cancellation", data);
  equal(failed.failed, 1, "dedupe: provider failure is counted");
  check(
    [...failLog.rows.values()].some((r) => r.error?.includes("boom")),
    "dedupe: failure recorded on the row",
  );

  // WhatsApp channel is its own key and only runs when a provider is supplied.
  const wa = new NoopWhatsAppProvider();
  const waLog = new MemoryNotificationLog();
  const waNotify = createNotifier({
    email: new NoopEmailProvider(true),
    whatsapp: wa,
    log: waLog,
    practitionerEmail: null,
  });
  await waNotify("reminder_1h", data);
  equal(wa.sent.length, 1, "whatsapp: message sent when provider enabled");
  check(waLog.rows.has(`${data.booking.id}:reminder_1h:whatsapp`), "whatsapp: own dedupe key");
}
