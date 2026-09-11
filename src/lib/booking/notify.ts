/**
 * Bridge to P4-C's notification layer. The engine never awaits a send on the request path and
 * never lets a mail failure fail a booking; the notification log records what happened.
 */
import type { BookingWithRelations, NotificationKind } from "@/lib/notifications/types";

export type NotifyFn = (kind: NotificationKind, booking: BookingWithRelations) => Promise<unknown>;

export const defaultNotify: NotifyFn = async (kind, booking) => {
  const mod = await import("@/lib/notifications");
  return mod.notify(kind, booking);
};

/** Fire and forget; a failure is logged by class name only (never recipient or content). */
export function notifyInBackground(
  notify: NotifyFn | undefined,
  kind: NotificationKind,
  booking: BookingWithRelations,
): void {
  const fn = notify ?? defaultNotify;
  void Promise.resolve()
    .then(() => fn(kind, booking))
    .catch((error: unknown) => {
      console.error(
        `[booking] notify(${kind}) failed: ${error instanceof Error ? error.name : "unknown error"}`,
      );
    });
}
