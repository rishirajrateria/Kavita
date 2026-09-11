/**
 * Client-side POST helper shared by the two forms. Sends JSON, maps the API's typed result
 * onto the status vocabulary the status component renders. Never throws.
 */
import type { z } from "zod";
import type { FormStatusKind } from "./form-status";

export interface SubmitOutcome {
  status: FormStatusKind;
  errors: Record<string, string[]>;
}

export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export async function postForm(url: string, body: Record<string, unknown>): Promise<SubmitOutcome> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      { ok: true } | { ok: false; reason: string; errors?: Record<string, string[]> } | null;
    if (data?.ok) return { status: "sent", errors: {} };
    const reason = data && !data.ok ? data.reason : undefined;
    if (reason === "validation")
      return { status: "validation", errors: data && !data.ok ? (data.errors ?? {}) : {} };
    if (reason === "rate_limited") return { status: "rate_limited", errors: {} };
    if (reason === "not_connected" || res.status === 503)
      return { status: "not_connected", errors: {} };
    return { status: "server_error", errors: {} };
  } catch {
    return { status: "server_error", errors: {} };
  }
}
