"use client";

/**
 * The one client island every management form uses. Serialises its fields to JSON, posts to an
 * `/api/admin/*` route handler, shows the typed error (field errors included) and refreshes the
 * server-rendered page on success. Destructive actions ask for confirmation first. Keys ending
 * in `[]` become arrays; for a checkbox, pair it with a hidden `off` input of the same name so an
 * unticked box posts `"off"` (last value wins).
 */
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionFormProps {
  action: string;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  /** Ask before submitting (destructive actions). */
  confirm?: string;
  /** Navigate here after success instead of only refreshing. */
  redirectTo?: string;
  submitLabel?: string;
  variant?: "default" | "gold" | "gold-outline" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "xs";
  /** Extra JSON merged into the body (e.g. `{ action: "confirm" }`). */
  payload?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
  /** Inline (a single button) vs stacked form with fields. */
  inline?: boolean;
  successMessage?: string;
  children?: ReactNode;
  /** Called with the parsed JSON on success (for pages that show the result). */
  onSuccess?: (body: Record<string, unknown>) => void;
}

type Status =
  | { state: "idle" }
  | { state: "busy" }
  | { state: "done"; message: string }
  | { state: "error"; message: string; fields?: Record<string, string[]> };

export function serializeForm(form: HTMLFormElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, value] of new FormData(form).entries()) {
    if (typeof value !== "string") continue;
    if (rawKey.endsWith("[]")) {
      const key = rawKey.slice(0, -2);
      const list = (out[key] ??= []) as string[];
      list.push(value);
    } else {
      out[rawKey] = value;
    }
  }
  return out;
}

const REASON_TEXT: Record<string, string> = {
  unauthorized: "Your session has expired. Sign in again.",
  forbidden: "Your role cannot make this change.",
  validation: "Please check the highlighted fields.",
  bad_request: "The request was malformed.",
  not_found: "That record no longer exists.",
  conflict: "That change conflicts with the current state.",
  not_connected: "Not connected to Supabase — nothing was saved.",
  rate_limited: "Too many requests; try again shortly.",
  server_error: "Something went wrong on the server.",
};

export function ActionForm({
  action,
  method = "POST",
  confirm,
  redirectTo,
  submitLabel = "Save",
  variant = "gold",
  size = "default",
  payload,
  disabled,
  className,
  inline,
  successMessage = "Saved.",
  children,
  onSuccess,
}: ActionFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const statusId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    setStatus({ state: "busy" });
    try {
      const response = await fetch(action, {
        method,
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ ...serializeForm(event.currentTarget), ...(payload ?? {}) }),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok || body.ok === false) {
        const reason = String(body.reason ?? "server_error");
        const detail =
          typeof body.message === "string" && body.message !== reason ? ` ${body.message}` : "";
        setStatus({
          state: "error",
          message: (REASON_TEXT[reason] ?? `Failed (${reason}).`) + detail,
          fields: (body.errors as Record<string, string[]> | undefined) ?? undefined,
        });
        return;
      }
      setStatus({ state: "done", message: successMessage });
      onSuccess?.(body);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setStatus({ state: "error", message: "Network error — nothing was saved." });
    }
  }

  const busy = status.state === "busy";
  return (
    <form
      onSubmit={submit}
      aria-describedby={statusId}
      className={cn(
        inline ? "inline-flex flex-col items-start gap-1" : "flex flex-col gap-4",
        className,
      )}
    >
      {children}
      <div className={cn("flex flex-wrap items-center gap-3", inline && "gap-2")}>
        <Button type="submit" variant={variant} size={size} disabled={disabled || busy}>
          {busy ? "Working…" : submitLabel}
        </Button>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={cn(
            "text-xs",
            status.state === "error" ? "text-error" : "text-success",
            status.state === "idle" || status.state === "busy" ? "sr-only" : "",
          )}
        >
          {status.state === "done" || status.state === "error" ? status.message : ""}
          {status.state === "error" && status.fields
            ? " " +
              Object.entries(status.fields)
                .map(([k, v]) => `${k}: ${v.join(", ")}`)
                .join("; ")
            : null}
        </p>
      </div>
    </form>
  );
}
