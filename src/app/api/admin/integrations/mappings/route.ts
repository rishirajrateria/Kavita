/**
 * `PATCH /api/admin/integrations/mappings` — override one row of the event-mapping table, and
 * `DELETE` to fall back to the built-in default (CLAUDE.md §13D).
 *
 * The internal vocabulary (`booking_completed`, `contact_submitted`, …) is fixed; what changes
 * here is the name and parameters each platform receives. Parameters are entered as
 * `key=value` lines; `{placeholder}` values are substituted from the event payload at fire time.
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { eventMappings, type EventMappingParams } from "@/db/schema/integrations";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { CONVERSION_EVENTS } from "@/lib/events";
import { EVENT_PROVIDERS } from "@/lib/integrations/mappings";
import { isIntegrationProvider, type IntegrationProvider } from "@/lib/integrations/providers";

export const dynamic = "force-dynamic";

/** `key=value` per line → a params object. Blank lines and stray whitespace are ignored. */
export function parseParamLines(raw: string): { params: EventMappingParams; error: string | null } {
  const params: EventMappingParams = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) return { params, error: `Not a key=value line: ${trimmed.slice(0, 40)}` };
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!/^[A-Za-z0-9_.]{1,40}$/.test(key)) {
      return { params, error: `Not a valid parameter name: ${key.slice(0, 40)}` };
    }
    params[key] = value;
  }
  return { params, error: null };
}

const schema = z.object({
  provider: z.string().refine(isIntegrationProvider, "Unknown provider"),
  internalEvent: z.enum(CONVERSION_EVENTS),
  providerEvent: z.string().trim().min(1).max(80),
  params: z.string().max(2000).optional(),
  isEnabled: z.union([z.boolean(), z.literal("on"), z.literal("off")]).optional(),
});

export const PATCH = adminRoute(
  async ({ data, audit }) => {
    const provider = data.provider as IntegrationProvider;
    if (!EVENT_PROVIDERS.includes(provider)) {
      throw new AdminRouteError("validation", "That provider does not receive conversion events.");
    }
    const parsed = parseParamLines(data.params ?? "");
    if (parsed.error) {
      throw new AdminRouteError("validation", parsed.error, { errors: { params: [parsed.error] } });
    }
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");

    const before =
      (
        await db
          .select()
          .from(eventMappings)
          .where(
            and(
              eq(eventMappings.provider, provider),
              eq(eventMappings.internalEvent, data.internalEvent),
            ),
          )
      )[0] ?? null;
    const values = {
      provider,
      internalEvent: data.internalEvent,
      providerEvent: data.providerEvent.trim(),
      params: parsed.params,
      isEnabled:
        data.isEnabled === undefined ? true : data.isEnabled === true || data.isEnabled === "on",
    };
    const rows = await db
      .insert(eventMappings)
      .values(values)
      .onConflictDoUpdate({
        target: [eventMappings.provider, eventMappings.internalEvent],
        set: values,
      })
      .returning();
    const after = rows[0];
    if (!after) throw new AdminRouteError("server_error");
    await audit({
      action: "event_mappings.update",
      entityType: "event_mappings",
      entityId: after.id,
      before,
      after,
    });
    return { mapping: after };
  },
  { role: "owner", schema },
);

export const DELETE = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const rows = await db
      .delete(eventMappings)
      .where(
        and(
          eq(eventMappings.provider, data.provider as IntegrationProvider),
          eq(eventMappings.internalEvent, data.internalEvent),
        ),
      )
      .returning();
    const removed = rows[0];
    if (!removed) throw new AdminRouteError("not_found", "That mapping is already the default.");
    await audit({
      action: "event_mappings.reset",
      entityType: "event_mappings",
      entityId: removed.id,
      before: removed,
    });
    return { reset: `${removed.provider}:${removed.internalEvent}` };
  },
  {
    role: "owner",
    schema: z.object({
      provider: z.string().refine(isIntegrationProvider, "Unknown provider"),
      internalEvent: z.enum(CONVERSION_EVENTS),
    }),
  },
);
