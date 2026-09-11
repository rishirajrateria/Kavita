/**
 * `POST /api/contact` — the contact form. JSON or HTML-form body, Zod-validated, honeypot,
 * rate-limited (5 per 10 minutes per client), written to `contact_messages` with the service
 * role when a database is configured; otherwise 503 `not_connected` and the page shows the
 * WhatsApp/email fallback. No GET: the route exists only to receive. On success it fires the
 * internal `contact_submitted` event and, when the Meta Conversions API is connected, sends the
 * same event server-side with hashed contact details under the same `event_id` (§13C).
 */
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { track } from "@/lib/events";
import { sendConversion } from "@/lib/integrations/capi-events";
import { contactSchema } from "@/lib/validation/contact";
import { handleFormPost } from "@/lib/validation/form-request";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleFormPost(request, {
    schema: contactSchema,
    redirectPath: "/contact",
    persist: async (data, ctx) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(contactMessages).values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        sourcePath: ctx.sourcePath,
        region: ctx.region,
      });
    },
    onSuccess: (data) => {
      const event = track("contact_submitted", {
        source: "web_form",
        hasPhone: data.phone !== null,
      });
      // Same event_id as the browser pixel, so Meta de-duplicates the pair (CLAUDE.md §13C).
      sendConversion(
        { internalEvent: "contact_submitted", eventId: event.eventId, payload: {} },
        { email: data.email, phone: data.phone, firstName: data.name.split(" ")[0] ?? null },
        { request, sourceUrl: request.headers.get("referer") },
      );
    },
  });
}
