/**
 * Server-side event-mapping read (CLAUDE.md §13D): the pure defaults from `./mappings-core`
 * with the admin's `event_mappings` rows layered on top. Kept apart from the core so the
 * browser fan-out island never pulls the database client into the client bundle.
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { cache } from "react";
import { getDb } from "@/db";
import type * as schema from "@/db/schema";
import { eventMappings } from "@/db/schema/integrations";
import { mergeEventMappings, defaultEventMappings, type EventMapping } from "./mappings-core";

export * from "./mappings-core";

export type MappingsDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Server: defaults merged with `event_mappings` rows (or defaults alone without a database). */
export const getEventMappings = cache(async (db?: MappingsDb | null): Promise<EventMapping[]> => {
  const database = db === undefined ? getDb() : db;
  if (!database) return defaultEventMappings();
  const rows = await database.select().from(eventMappings);
  return mergeEventMappings(rows);
});
