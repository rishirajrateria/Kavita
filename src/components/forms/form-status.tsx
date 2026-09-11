import { Callout } from "@/components/ui/callout";
import { FormFallback, type FallbackChannels } from "./fallback";

export interface FormStatusCopy {
  success: { title: string; body: string };
  fallback: { title: string; body: string };
  errors: { generic: string; validation: string; rateLimited: string };
}

export type FormStatusKind =
  | "sent"
  | "validation"
  | "rate_limited"
  | "not_connected"
  | "bad_request"
  | "server_error"
  | undefined;

export function statusFromSearchParams(sp: {
  sent?: string | string[];
  error?: string | string[];
}): FormStatusKind {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  if (one(sp.sent) === "1") return "sent";
  const err = one(sp.error);
  if (
    err === "validation" ||
    err === "rate_limited" ||
    err === "not_connected" ||
    err === "bad_request" ||
    err === "server_error"
  ) {
    return err;
  }
  return undefined;
}

/**
 * Status message for a form, rendered by the client form after a fetch and by the server page
 * after a JavaScript-free redirect (`?sent=1`, `?error=…`). Same markup both ways.
 */
export function FormStatus({
  status,
  copy,
  channels,
}: {
  status: FormStatusKind;
  copy: FormStatusCopy;
  channels: FallbackChannels;
}) {
  if (!status) return null;
  if (status === "sent") {
    return (
      <Callout variant="success" title={copy.success.title} role="status">
        {copy.success.body}
      </Callout>
    );
  }
  if (status === "not_connected") {
    return (
      <FormFallback title={copy.fallback.title} body={copy.fallback.body} channels={channels} />
    );
  }
  const text =
    status === "validation"
      ? copy.errors.validation
      : status === "rate_limited"
        ? copy.errors.rateLimited
        : copy.errors.generic;
  return <Callout variant="error">{text}</Callout>;
}
