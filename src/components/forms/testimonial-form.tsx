"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SHARE_FORM } from "@/content/pages/testimonials";
import { HONEYPOT_FIELD } from "@/lib/validation/contact";
import { testimonialSchema } from "@/lib/validation/testimonial";
import type { FallbackChannels } from "./fallback";
import { describedBy, Field, NativeSelect } from "./field";
import { FormStatus, type FormStatusKind } from "./form-status";
import { fieldErrorsFrom, postForm } from "./submit";

const F = SHARE_FORM.fields;

export interface ServiceOption {
  slug: string;
  name: string;
}

/** Client-experience intake. Same progressive-enhancement pattern as the contact form. */
export function TestimonialForm({
  services,
  channels,
  initialStatus,
}: {
  services: ServiceOption[];
  channels: FallbackChannels;
  initialStatus?: FormStatusKind;
}) {
  const [status, setStatus] = useState<FormStatusKind>(initialStatus);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const parsed = testimonialSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      setStatus("validation");
      return;
    }
    setPending(true);
    setErrors({});
    const result = await postForm("/api/testimonials", raw);
    setPending(false);
    setStatus(result.status);
    setErrors(result.errors);
    if (result.status === "sent") form.reset();
  }

  if (status === "sent") {
    return (
      <div id="form" className="scroll-mt-24">
        <FormStatus status={status} copy={SHARE_FORM} channels={channels} />
      </div>
    );
  }

  return (
    <form
      id="form"
      method="post"
      action="/api/testimonials"
      onSubmit={onSubmit}
      noValidate
      className="scroll-mt-24 space-y-6"
      aria-describedby="share-privacy"
    >
      <FormStatus status={status} copy={SHARE_FORM} channels={channels} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label={F.name} hint={F.nameHint} required errors={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", F.nameHint, errors.name)}
          />
        </Field>
        <Field id="email" label={F.email} hint={F.emailHint} required errors={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", F.emailHint, errors.email)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="location"
          label={F.location}
          hint={F.locationHint}
          required
          errors={errors.location}
        >
          <Input
            id="location"
            name="location"
            required
            maxLength={120}
            aria-invalid={errors.location ? true : undefined}
            aria-describedby={describedBy("location", F.locationHint, errors.location)}
          />
        </Field>
        <Field id="serviceSlug" label={F.service} errors={errors.serviceSlug}>
          <NativeSelect id="serviceSlug" name="serviceSlug" defaultValue="">
            <option value="">{F.servicePlaceholder}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{F.rating}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm has-checked:border-accent-border has-checked:bg-accent">
            <input
              type="radio"
              name="rating"
              value=""
              defaultChecked
              className="accent-accent-strong"
            />
            {F.ratingNone}
          </label>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm has-checked:border-accent-border has-checked:bg-accent"
            >
              <input type="radio" name="rating" value={n} className="accent-accent-strong" />
              {n} / 5
            </label>
          ))}
        </div>
        {errors.rating ? (
          <p role="alert" className="text-xs font-medium text-error">
            {errors.rating.join(" ")}
          </p>
        ) : null}
      </fieldset>

      <Field
        id="experience"
        label={F.experience}
        hint={F.experienceHint}
        required
        errors={errors.experience}
      >
        <Textarea
          id="experience"
          name="experience"
          required
          minLength={40}
          maxLength={2000}
          rows={7}
          aria-invalid={errors.experience ? true : undefined}
          aria-describedby={describedBy("experience", F.experienceHint, errors.experience)}
        />
      </Field>

      <div className="space-y-1.5 rounded-lg border border-accent-border/40 bg-surface-muted p-4">
        <label htmlFor="consent" className="flex items-start gap-3 text-sm font-medium">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            className="mt-0.5 size-4 accent-accent-strong"
          />
          <span>{F.consent}</span>
        </label>
        <p className="pl-7 text-xs leading-relaxed text-muted-foreground">{F.consentHint}</p>
      </div>

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

      <p id="share-privacy" className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        {SHARE_FORM.privacy}
      </p>

      <Button type="submit" variant="gold" size="xl" disabled={pending}>
        {pending ? F.sending : F.submit}
      </Button>
    </form>
  );
}
