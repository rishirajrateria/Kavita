"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { PaperclipIcon, XIcon } from "lucide-react";
import { describedBy, Field, NativeSelect } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { BOOK_DETAILS_STEP } from "@/content/pages/book";
import { DIAL_CODES } from "@/lib/validation/contact";
import { needsBirth, needsProperty, uploadFloorPlan } from "./api";
import type {
  BirthTimeAccuracy,
  BookableService,
  DetailsState,
  Gender,
  PropertyType,
} from "./types";

const C = BOOK_DETAILS_STEP;

export interface StepDetailsProps {
  service: BookableService;
  details: DetailsState;
  errors: Record<string, string[]>;
  onChange: (patch: Partial<DetailsState>) => void;
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function Group({
  heading,
  why,
  children,
}: {
  heading: string;
  why?: string;
  children: React.ReactNode;
}) {
  const id = `group-${slug(heading)}`;
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="space-y-5 border-t border-accent-border/30 pt-6 first:border-t-0 first:pt-0"
    >
      <h3 id={id} className="font-serif text-xl text-foreground">
        {heading}
      </h3>
      {why ? (
        <p className="max-w-[44rem] rounded-lg border border-accent-border/40 bg-accent/40 px-4 py-3 text-sm leading-relaxed text-foreground">
          {why}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/**
 * Step 4: contact details, then only the groups the chosen service needs — birth details for
 * astrology-led and integrated readings, the property for vastu-led and integrated — each with
 * a plain "why we need this" note. Gender is optional and says so.
 */
export function StepDetails({ service, details: d, errors, onChange }: StepDetailsProps) {
  const [upload, setUpload] = useState<{
    busy: boolean;
    message: string | null;
    tone: "warn" | "error";
  }>({
    busy: false,
    message: null,
    tone: "warn",
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const inv = (key: string) => (errors[key] ? true : undefined);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUpload({ busy: true, message: null, tone: "warn" });
    const result = await uploadFloorPlan(file);
    if (result.ok) {
      onChange({ floorPlan: { storagePath: result.storagePath, fileName: result.fileName } });
      setUpload({ busy: false, message: null, tone: "warn" });
    } else {
      const message =
        result.reason === "unavailable"
          ? C.property.uploadUnavailable
          : result.reason === "too_large"
            ? C.property.uploadTooLarge
            : result.reason === "wrong_type"
              ? C.property.uploadWrongType
              : C.property.uploadFailed;
      setUpload({ busy: false, message, tone: result.reason === "unavailable" ? "warn" : "error" });
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="max-w-[44rem] space-y-8">
      <Group heading={C.contact.heading}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label={C.contact.name} required errors={errors.fullName}>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              maxLength={100}
              value={d.name}
              onChange={(e) => onChange({ name: e.target.value })}
              aria-invalid={inv("fullName")}
              aria-describedby={describedBy("fullName", undefined, errors.fullName)}
              className="h-11"
            />
          </Field>
          <Field
            id="email"
            label={C.contact.email}
            hint={C.contact.emailHint}
            required
            errors={errors.email}
          >
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={d.email}
              onChange={(e) => onChange({ email: e.target.value })}
              aria-invalid={inv("email")}
              aria-describedby={describedBy("email", C.contact.emailHint, errors.email)}
              className="h-11"
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,12rem)_1fr]">
          <Field id="dialCode" label={C.contact.dialCode} errors={errors.dialCode}>
            <NativeSelect
              id="dialCode"
              name="dialCode"
              value={d.dialCode}
              onChange={(e) => onChange({ dialCode: e.target.value })}
              autoComplete="tel-country-code"
              className="h-11"
            >
              {DIAL_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            id="phone"
            label={C.contact.phone}
            hint={C.contact.phoneHint}
            errors={errors.phone ?? errors.customDialCode}
          >
            <div className="flex gap-2">
              {d.dialCode === "other" ? (
                <Input
                  id="customDialCode"
                  name="customDialCode"
                  inputMode="tel"
                  placeholder={C.contact.customDialCodePlaceholder}
                  aria-label={C.contact.customDialCode}
                  maxLength={6}
                  value={d.customDialCode}
                  onChange={(e) => onChange({ customDialCode: e.target.value })}
                  aria-invalid={inv("customDialCode")}
                  className="h-11 w-24 shrink-0"
                />
              ) : null}
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={30}
                value={d.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                aria-invalid={inv("phone")}
                aria-describedby={describedBy("phone", C.contact.phoneHint, errors.phone)}
                className="h-11"
              />
            </div>
          </Field>
        </div>
        <Field id="preferredLanguage" label={C.contact.language} hint={C.contact.languageHint}>
          <Input
            id="preferredLanguage"
            name="preferredLanguage"
            maxLength={40}
            value={d.preferredLanguage}
            onChange={(e) => onChange({ preferredLanguage: e.target.value })}
            className="h-11 sm:max-w-xs"
          />
        </Field>
      </Group>

      {needsBirth(service) ? (
        <Group heading={C.birth.heading} why={C.birth.why}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="birthDate" label={C.birth.date} required errors={errors.birthDate}>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                max="9999-12-31"
                value={d.birthDate}
                onChange={(e) => onChange({ birthDate: e.target.value })}
                aria-invalid={inv("birthDate")}
                aria-describedby={describedBy("birthDate", undefined, errors.birthDate)}
                className="h-11"
              />
            </Field>
            <Field id="birthTimeAccuracy" label={C.birth.accuracy}>
              <NativeSelect
                id="birthTimeAccuracy"
                name="birthTimeAccuracy"
                value={d.birthTimeAccuracy}
                onChange={(e) =>
                  onChange({ birthTimeAccuracy: e.target.value as BirthTimeAccuracy })
                }
                className="h-11"
              >
                {(Object.keys(C.birth.accuracyOptions) as BirthTimeAccuracy[]).map((k) => (
                  <option key={k} value={k}>
                    {C.birth.accuracyOptions[k]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="birthTime"
              label={C.birth.time}
              hint={C.birth.timeHint}
              errors={errors.birthTime}
              className={d.birthTimeAccuracy === "unknown" ? "opacity-50" : undefined}
            >
              <Input
                id="birthTime"
                name="birthTime"
                type="time"
                value={d.birthTime}
                disabled={d.birthTimeAccuracy === "unknown"}
                onChange={(e) => onChange({ birthTime: e.target.value })}
                aria-invalid={inv("birthTime")}
                aria-describedby={describedBy("birthTime", C.birth.timeHint, errors.birthTime)}
                className="h-11"
              />
            </Field>
            <Field
              id="birthPlace"
              label={C.birth.place}
              hint={C.birth.placeHint}
              required
              errors={errors.birthPlace}
            >
              <Input
                id="birthPlace"
                name="birthPlace"
                required
                maxLength={160}
                value={d.birthPlace}
                onChange={(e) => onChange({ birthPlace: e.target.value })}
                aria-invalid={inv("birthPlace")}
                aria-describedby={describedBy("birthPlace", C.birth.placeHint, errors.birthPlace)}
                className="h-11"
              />
            </Field>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{C.birth.privacy}</p>
        </Group>
      ) : null}

      {needsProperty(service) ? (
        <Group heading={C.property.heading} why={C.property.why}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="propertyType" label={C.property.type} required errors={errors.propertyType}>
              <NativeSelect
                id="propertyType"
                name="propertyType"
                required
                value={d.propertyType}
                onChange={(e) => onChange({ propertyType: e.target.value as PropertyType | "" })}
                aria-invalid={inv("propertyType")}
                className="h-11"
              >
                <option value="">Choose…</option>
                {(Object.keys(C.property.typeOptions) as PropertyType[]).map((k) => (
                  <option key={k} value={k}>
                    {C.property.typeOptions[k]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="compassReading"
              label={C.property.facing}
              hint={C.property.facingHint}
              errors={errors.compassReading}
            >
              <Input
                id="compassReading"
                name="compassReading"
                maxLength={120}
                value={d.entranceFacing}
                onChange={(e) => onChange({ entranceFacing: e.target.value })}
                className="h-11"
              />
            </Field>
          </div>
          <Field
            id="floorPlan"
            label={C.property.floorPlan}
            hint={C.property.floorPlanHint}
            errors={errors.floorPlanPath}
          >
            {d.floorPlan ? (
              <div className="flex min-h-11 flex-wrap items-center gap-3 rounded-md border border-accent-border/50 bg-accent/30 px-3 py-2 text-sm">
                <PaperclipIcon aria-hidden="true" className="size-4 text-accent-strong" />
                <span className="min-w-0 flex-1 truncate">
                  {C.property.uploaded(d.floorPlan.fileName)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ floorPlan: null })}
                >
                  <XIcon aria-hidden="true" />
                  {C.property.remove}
                </Button>
              </div>
            ) : (
              <Input
                ref={fileInput}
                id="floorPlan"
                name="floorPlan"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={onFile}
                disabled={upload.busy}
                aria-busy={upload.busy || undefined}
                aria-describedby={describedBy(
                  "floorPlan",
                  C.property.floorPlanHint,
                  errors.floorPlanPath,
                )}
                className="h-11 pt-2"
              />
            )}
            {upload.busy ? (
              <p className="text-xs text-muted-foreground">{C.property.uploading}</p>
            ) : null}
          </Field>
          {upload.message ? (
            <Callout variant={upload.tone} role="status">
              {upload.message}
            </Callout>
          ) : null}
        </Group>
      ) : null}

      <Group heading={C.optional.heading}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="gender" label={C.optional.gender} hint={C.optional.genderHint}>
            <NativeSelect
              id="gender"
              name="gender"
              value={d.gender}
              onChange={(e) => onChange({ gender: e.target.value as Gender })}
              className="h-11"
            >
              {(Object.keys(C.optional.genderOptions) as Gender[]).map((k) => (
                <option key={k} value={k}>
                  {C.optional.genderOptions[k]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {d.gender === "self" ? (
            <Field id="genderSelf" label={C.optional.genderSelf}>
              <Input
                id="genderSelf"
                maxLength={40}
                value={d.genderSelf}
                onChange={(e) => onChange({ genderSelf: e.target.value })}
                className="h-11"
              />
            </Field>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="marketingConsent"
            checked={d.marketingConsent}
            onChange={(e) => onChange({ marketingConsent: e.target.checked })}
            className="mt-1 size-4 shrink-0 accent-(--cta)"
          />
          <span>{C.optional.marketing}</span>
        </label>
      </Group>
    </div>
  );
}
