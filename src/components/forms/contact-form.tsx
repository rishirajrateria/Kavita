"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_FORM } from "@/content/pages/contact";
import { contactSchema, DIAL_CODES, HONEYPOT_FIELD } from "@/lib/validation/contact";
import type { FallbackChannels } from "./fallback";
import { describedBy, Field, NativeSelect } from "./field";
import { FormStatus, type FormStatusKind } from "./form-status";
import { fieldErrorsFrom, postForm } from "./submit";

const F = CONTACT_FORM.fields;

/**
 * Contact form. Progressive enhancement: a plain `<form method="post">` that the route handler
 * accepts as URL-encoded and redirects back; with JavaScript the same body is sent as JSON and
 * the result is shown in place. Zod validation runs here first, then again on the server.
 */
export function ContactForm({
  channels,
  initialStatus,
}: {
  channels: FallbackChannels;
  initialStatus?: FormStatusKind;
}) {
  const [status, setStatus] = useState<FormStatusKind>(initialStatus);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [dialCode, setDialCode] = useState<string>("+91");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      setStatus("validation");
      return;
    }
    setPending(true);
    setErrors({});
    const result = await postForm("/api/contact", raw);
    setPending(false);
    setStatus(result.status);
    setErrors(result.errors);
    if (result.status === "sent") form.reset();
  }

  return (
    <form
      id="form"
      method="post"
      action="/api/contact"
      onSubmit={onSubmit}
      noValidate
      className="scroll-mt-24 space-y-6"
      aria-describedby="contact-privacy"
    >
      <FormStatus status={status} copy={CONTACT_FORM} channels={channels} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label={F.name} required errors={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", undefined, errors.name)}
          />
        </Field>
        <Field id="email" label={F.email} required errors={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", undefined, errors.email)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <Field id="dialCode" label={F.dialCode} errors={errors.dialCode}>
          <NativeSelect
            id="dialCode"
            name="dialCode"
            value={dialCode}
            onChange={(e) => setDialCode(e.target.value)}
            autoComplete="tel-country-code"
          >
            {DIAL_CODES.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          id="phone"
          label={F.phone}
          hint={F.phoneHint}
          errors={errors.phone ?? errors.customDialCode}
        >
          <div className="flex gap-2">
            {dialCode === "other" ? (
              <Input
                id="customDialCode"
                name="customDialCode"
                inputMode="tel"
                placeholder={F.customDialCodePlaceholder}
                aria-label={F.customDialCode}
                maxLength={6}
                className="w-24 shrink-0"
                aria-invalid={errors.customDialCode ? true : undefined}
              />
            ) : null}
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={30}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={describedBy("phone", F.phoneHint, errors.phone)}
            />
          </div>
        </Field>
      </div>

      <Field id="message" label={F.message} hint={F.messageHint} required errors={errors.message}>
        <Textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", F.messageHint, errors.message)}
        />
      </Field>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>Website</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <p id="contact-privacy" className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {CONTACT_FORM.privacy}
      </p>

      <Button type="submit" variant="gold" size="xl" disabled={pending}>
        {pending ? F.sending : F.submit}
      </Button>
    </form>
  );
}
