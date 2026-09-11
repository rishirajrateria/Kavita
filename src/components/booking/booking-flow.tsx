"use client";

/**
 * The one client island of `/book`: seven steps in a card beside a progress rail. State is a
 * reducer; validation is the shared `bookingRequestSchema` filtered to the current step; the
 * only network calls are availability, the floor-plan upload and the final POST.
 */
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { BOOK_ERRORS, BOOK_MODE_STEP, BOOK_NAV } from "@/content/pages/book";
import { dualZoneParts, formatInZone } from "@/lib/booking/format";
import { bookingRequestSchema } from "@/lib/booking/schemas";
import { track } from "@/lib/events";
import { bookingEventId } from "@/lib/integrations/event-ids";
import { buildPayload, fallbackSummary, needsBirth, needsProperty, postBooking } from "./api";
import { Confirmation } from "./confirmation";
import { FallbackScreen } from "./fallback-screen";
import { ProgressRail } from "./progress-rail";
import { SlotList } from "./slot-list";
import { flowReducer, initialFlowState, type StepIndex } from "./state";
import { StepDetails } from "./step-details";
import { StepFrame } from "./step-frame";
import { StepMode } from "./step-mode";
import { StepQuestion } from "./step-question";
import { StepReview } from "./step-review";
import { StepService } from "./step-service";
import { StepTime } from "./step-time";
import { detectZone } from "./timezones";
import type { BookableService, BookingFlowProps, DetailsState, Slot } from "./types";
import { useAvailability } from "./use-availability";

const subscribeNoop = () => () => {};

const DETAIL_FIELDS = new Set([
  "fullName",
  "email",
  "dialCode",
  "customDialCode",
  "phone",
  "preferredLanguage",
  "birthDate",
  "birthTime",
  "birthPlace",
  "birthTimeAccuracy",
  "propertyType",
  "floorPlanPath",
  "compassReading",
  "gender",
]);

type Errors = Record<string, string[]>;

/** Details-state keys → schema field names, so a corrected field drops its error at once. */
const FIELD_OF: Partial<Record<keyof DetailsState, string>> = {
  name: "fullName",
  entranceFacing: "compassReading",
  floorPlan: "floorPlanPath",
};

function schemaErrors(payload: Record<string, unknown>): Errors {
  const parsed = bookingRequestSchema.safeParse(payload);
  if (parsed.success) return {};
  const out: Errors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Fields the schema leaves optional but the chosen service genuinely needs. */
function requiredErrors(
  state: ReturnType<typeof initialFlowState>,
  service: BookableService,
): Errors {
  const out: Errors = {};
  const d = state.details;
  if (!d.name.trim()) out.fullName = ["Enter your name"];
  if (!d.email.trim()) out.email = ["Enter your email address"];
  if (needsBirth(service)) {
    if (!d.birthDate) out.birthDate = ["Enter your date of birth"];
    if (!d.birthPlace.trim()) out.birthPlace = ["Enter your place of birth"];
  }
  if (needsProperty(service) && !d.propertyType) out.propertyType = ["Choose the type of property"];
  return out;
}

export function BookingFlow(props: BookingFlowProps & { maxMonth: string; brandName: string }) {
  const { services, practitionerTz, location, channels } = props;
  const [state, dispatch] = useReducer(
    flowReducer,
    {
      serviceSlug: services.some((s) => s.slug === props.initialServiceSlug)
        ? (props.initialServiceSlug ?? null)
        : null,
      clientTz: location?.timezone ?? practitionerTz,
      month: props.initialMonth,
    },
    initialFlowState,
  );
  const [errors, setErrors] = useState<Errors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const started = useRef(false);

  // Device zone, read without an effect so the server render and hydration agree (null on the
  // server). It applies until the visitor picks a zone by hand.
  const detectedTz = useSyncExternalStore(subscribeNoop, detectZone, () => null);
  const clientTz = state.tzChosen ? state.clientTz : (detectedTz ?? state.clientTz);

  const service = services.find((s) => s.slug === state.serviceSlug) ?? null;
  const availability = useAvailability(state.serviceSlug, state.month, clientTz, state.step === 2);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track("booking_started", {
      serviceSlug: props.initialServiceSlug,
      locationPath: location?.path,
    });
  }, [props.initialServiceSlug, location?.path]);

  // Every step change: announce it (focus the heading), keep the card in view, log the step.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    track("booking_step", { step: state.step + 1, serviceSlug: state.serviceSlug ?? undefined });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    const target =
      state.step === 6 ? document.getElementById("booking-confirmed") : headingRef.current;
    target?.focus({ preventScroll: true });
  }, [state.step, state.serviceSlug]);

  // A failed submit: move focus to the explanation so it is read out and in view.
  useEffect(() => {
    if (!state.failure || state.failure.kind === "not_connected") return;
    const el = cardRef.current?.querySelector<HTMLElement>("[data-booking-notice]");
    el?.focus({ preventScroll: false });
  }, [state.failure]);

  const go = useCallback((step: StepIndex) => {
    setErrors({});
    dispatch({ type: "go", step });
  }, []);

  function next() {
    setErrors({});
    dispatch({ type: "next" });
  }

  function validateDetails(): boolean {
    if (!service) return false;
    const payload = buildPayload({ ...state, clientTz }, service, location?.path ?? null);
    const all = { ...schemaErrors(payload), ...requiredErrors(state, service) };
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => DETAIL_FIELDS.has(k)));
    setErrors(mine);
    if (Object.keys(mine).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return false;
    }
    return true;
  }

  async function submit() {
    if (!service || !state.slot || !state.mode) return;
    const payload = buildPayload({ ...state, clientTz }, service, location?.path ?? null);
    const local = { ...schemaErrors(payload), ...requiredErrors(state, service) };
    if (Object.keys(local).length > 0) {
      setErrors(local);
      dispatch({ type: "go", step: Object.keys(local).some((k) => DETAIL_FIELDS.has(k)) ? 3 : 2 });
      return;
    }
    dispatch({ type: "submit:start" });
    const result = await postBooking(payload);
    if (result.ok) {
      // Same id the server sends to the Meta Conversions API, so the pair de-duplicates (§13C).
      track(
        "booking_completed",
        { serviceSlug: service.slug },
        result.receipt.bookingId ? { eventId: bookingEventId(result.receipt.bookingId) } : {},
      );
      dispatch({
        type: "submit:ok",
        receipt: { ...result.receipt, endsAt: result.receipt.endsAt || state.slot.endsAt },
      });
      return;
    }
    if (result.kind === "validation") {
      setErrors(result.errors);
      dispatch({ type: "submit:fail", failure: result });
      if (Object.keys(result.errors).some((k) => DETAIL_FIELDS.has(k)))
        dispatch({ type: "go", step: 3 });
      return;
    }
    if (result.kind === "slot_gone") {
      dispatch({ type: "slot", slot: null });
      availability.reload();
    }
    dispatch({ type: "submit:fail", failure: result });
  }

  function chooseAlternative(slot: Slot) {
    dispatch({ type: "slot", slot });
    dispatch({ type: "dismiss-failure" });
  }

  // ------------------------------------------------------------------------------------------
  const failure = state.failure;
  const notice =
    failure && failure.kind !== "not_connected" ? (
      failure.kind === "slot_taken" ? (
        <Callout variant="warn" title={BOOK_ERRORS.slotTaken}>
          <div className="mt-3">
            <SlotList
              day={null}
              heading="Nearest free times"
              slots={failure.alternatives}
              selected={state.slot}
              clientTz={clientTz}
              practitionerTz={practitionerTz}
              onSelect={chooseAlternative}
            />
          </div>
          <Button type="button" variant="link" className="px-0" onClick={() => go(2)}>
            {BOOK_ERRORS.backToCalendar}
          </Button>
        </Callout>
      ) : (
        <Callout variant="error">
          {failure.kind === "validation"
            ? BOOK_ERRORS.validation
            : failure.kind === "rate_limited"
              ? BOOK_ERRORS.rateLimited
              : failure.kind === "network"
                ? BOOK_ERRORS.network
                : failure.kind === "slot_gone"
                  ? BOOK_ERRORS.slotGone
                  : BOOK_ERRORS.server}
        </Callout>
      )
    ) : null;

  let screen: React.ReactNode;
  if (state.step === 6 && state.receipt && service && state.mode) {
    screen = (
      <Confirmation
        receipt={state.receipt}
        service={service}
        mode={state.mode}
        clientTz={clientTz}
        practitionerTz={practitionerTz}
        rescheduleNoticeHours={props.rescheduleNoticeHours}
        brandName={props.brandName}
      />
    );
  } else if (failure?.kind === "not_connected" && service && state.slot && state.mode) {
    const parts = dualZoneParts(state.slot.startsAt, clientTz, practitionerTz);
    screen = (
      <FallbackScreen
        channels={channels}
        onBack={() => dispatch({ type: "dismiss-failure" })}
        summary={fallbackSummary({
          service: service.name,
          mode: BOOK_MODE_STEP.modes[state.mode].label,
          whenClient: `${formatInZone(state.slot.startsAt, clientTz, "long-date")}, ${parts.clientTime} ${parts.clientZone}`,
          whenPractitioner: parts.practitionerTime
            ? `${parts.practitionerTime} ${parts.practitionerZone}`
            : null,
          name: state.details.name.trim(),
          question: state.question.trim(),
        })}
      />
    );
  } else if (state.step === 0 || !service) {
    screen = (
      <StepFrame step={0} headingRef={headingRef}>
        <StepService
          services={services}
          selected={state.serviceSlug}
          location={location ?? null}
          onSelect={(slug) => {
            dispatch({ type: "service", slug });
            next();
          }}
        />
      </StepFrame>
    );
  } else if (state.step === 1) {
    screen = (
      <StepFrame
        step={1}
        headingRef={headingRef}
        onBack={() => go(0)}
        onNext={state.mode ? next : undefined}
      >
        <StepMode
          service={service}
          selected={state.mode}
          inPersonOffered={props.inPersonOffered}
          practitionerCity={props.practitionerCity}
          onSelect={(mode) => {
            dispatch({ type: "mode", mode });
            next();
          }}
        />
      </StepFrame>
    );
  } else if (state.step === 2) {
    screen = (
      <StepFrame
        step={2}
        headingRef={headingRef}
        onBack={() => go(1)}
        onNext={next}
        nextDisabled={!state.slot}
        notice={notice}
      >
        <StepTime
          service={service}
          availability={availability}
          clientTz={clientTz}
          practitionerTz={practitionerTz}
          extraZones={[detectedTz ?? "", location?.timezone ?? ""].filter(Boolean)}
          month={state.month}
          day={state.day}
          slot={state.slot}
          minMonth={props.initialMonth}
          maxMonth={props.maxMonth}
          now={props.now}
          onZone={(tz) => dispatch({ type: "tz", tz, chosen: true })}
          onMonth={(month) => dispatch({ type: "month", month })}
          onDay={(day) => dispatch({ type: "day", day })}
          onSlot={(slot) => dispatch({ type: "slot", slot })}
        />
      </StepFrame>
    );
  } else if (state.step === 3) {
    screen = (
      <StepFrame
        step={3}
        headingRef={headingRef}
        onBack={() => go(2)}
        onNext={() => {
          if (validateDetails()) next();
        }}
        notice={
          Object.keys(errors).length > 0 ? (
            <Callout variant="error">{BOOK_ERRORS.validation}</Callout>
          ) : (
            notice
          )
        }
      >
        <StepDetails
          service={service}
          details={state.details}
          errors={errors}
          onChange={(patch) => {
            dispatch({ type: "details", patch });
            setErrors((prev) => {
              const next = { ...prev };
              for (const key of Object.keys(patch) as (keyof DetailsState)[]) {
                delete next[FIELD_OF[key] ?? key];
              }
              return next;
            });
          }}
        />
      </StepFrame>
    );
  } else if (state.step === 4) {
    screen = (
      <StepFrame
        step={4}
        headingRef={headingRef}
        onBack={() => go(3)}
        onNext={next}
        notice={notice}
      >
        <StepQuestion
          value={state.question}
          errors={errors.question}
          onChange={(text) => dispatch({ type: "question", text })}
        />
      </StepFrame>
    );
  } else if (state.slot && state.mode) {
    screen = (
      <StepFrame
        step={5}
        headingRef={headingRef}
        onBack={() => go(4)}
        onNext={submit}
        nextLabel={state.submitting ? BOOK_NAV.confirming : BOOK_NAV.confirm}
        nextBusy={state.submitting}
        notice={notice}
      >
        <StepReview
          service={service}
          mode={state.mode}
          slot={state.slot}
          clientTz={clientTz}
          practitionerTz={practitionerTz}
          details={state.details}
          question={state.question}
          onEdit={go}
        />
      </StepFrame>
    );
  } else {
    // A review without a slot or mode cannot happen through the UI; recover to the calendar.
    screen = (
      <StepFrame step={2} headingRef={headingRef} onBack={() => go(1)}>
        <Button type="button" variant="gold" onClick={() => go(2)}>
          {BOOK_ERRORS.backToCalendar}
        </Button>
      </StepFrame>
    );
  }

  return (
    <div ref={cardRef} className="scroll-mt-24 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-10">
      <div className="mb-6 lg:mb-0">
        <ProgressRail
          current={state.step}
          reached={state.reached}
          onJump={go}
          locked={state.receipt !== null}
        />
      </div>
      <div className="double-rule relative min-h-[36rem] rounded-2xl border border-accent-border/40 bg-background p-6 shadow-sm sm:p-10">
        {screen}
      </div>
    </div>
  );
}
