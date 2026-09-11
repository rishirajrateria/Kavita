/**
 * Idempotency ledger. `claim()` inserts a `notification_log` row FIRST; the unique
 * `dedupe_key` makes a concurrent or repeated `notify()` lose the race and skip, so a message is
 * sent at most once per booking, kind and channel. After sending, the row is stamped with
 * `sent_at`/`provider_ref` or `error`. Raw SQL by column name so this module does not depend on
 * the Drizzle table object P4-A adds.
 */
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import type { NotificationChannel, NotificationLogKind } from "./types";

export interface LogEntry {
  bookingId: string;
  kind: NotificationLogKind;
  channel: NotificationChannel;
  dedupeKey: string;
}

export interface NotificationLog {
  /** Reserve the key. `null` = already claimed → skip. */
  claim(entry: LogEntry): Promise<{ id: string } | null>;
  markSent(id: string, providerRef: string | null): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

/** Process-local ledger for the no-database fallback and for tests. */
export class MemoryNotificationLog implements NotificationLog {
  readonly rows = new Map<
    string,
    LogEntry & { id: string; sentAt: Date | null; error: string | null }
  >();
  private counter = 0;

  async claim(entry: LogEntry): Promise<{ id: string } | null> {
    if (this.rows.has(entry.dedupeKey)) return null;
    const id = `mem-${++this.counter}`;
    this.rows.set(entry.dedupeKey, { ...entry, id, sentAt: null, error: null });
    return { id };
  }

  async markSent(id: string, _providerRef: string | null): Promise<void> {
    const row = [...this.rows.values()].find((r) => r.id === id);
    if (row) row.sentAt = new Date();
  }

  async markFailed(id: string, error: string): Promise<void> {
    const row = [...this.rows.values()].find((r) => r.id === id);
    if (row) row.error = error;
  }
}

/** Postgres `unique_violation`. */
const UNIQUE_VIOLATION = "23505";

function pgCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export class DbNotificationLog implements NotificationLog {
  constructor(private readonly db: Db) {}

  async claim(entry: LogEntry): Promise<{ id: string } | null> {
    try {
      const rows = await this.db.execute<{ id: string }>(sql`
        insert into notification_log (booking_id, kind, channel, dedupe_key)
        values (${entry.bookingId}, ${entry.kind}, ${entry.channel}, ${entry.dedupeKey})
        returning id
      `);
      const first = Array.isArray(rows) ? rows[0] : (rows as { rows?: { id: string }[] }).rows?.[0];
      if (!first?.id) throw new Error("notification_log insert returned no id");
      return { id: first.id };
    } catch (error) {
      if (pgCode(error) === UNIQUE_VIOLATION) return null;
      throw error;
    }
  }

  async markSent(id: string, providerRef: string | null): Promise<void> {
    await this.db.execute(sql`
      update notification_log set sent_at = now(), provider_ref = ${providerRef}, error = null
      where id = ${id}
    `);
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db.execute(sql`
      update notification_log set error = ${error.slice(0, 500)} where id = ${id}
    `);
  }
}
