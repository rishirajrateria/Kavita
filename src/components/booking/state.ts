/**
 * Booking-flow state: one reducer, seven steps, no library. Everything a step needs to render
 * lives here; nothing personal leaves the browser except in the final POST.
 */
import type { BookingMode, DetailsState, Slot, SubmitFailure, BookingReceipt } from "./types";

export const STEP_COUNT = 7;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FlowState {
  step: StepIndex;
  /** Highest step the visitor has completed, so the rail lets them jump back but not forward. */
  reached: StepIndex;
  serviceSlug: string | null;
  mode: BookingMode | null;
  clientTz: string;
  /** Whether the visitor changed the zone by hand (then auto-detection must not override it). */
  tzChosen: boolean;
  month: string;
  day: string | null;
  slot: Slot | null;
  details: DetailsState;
  question: string;
  submitting: boolean;
  failure: SubmitFailure | null;
  receipt: BookingReceipt | null;
}

export const EMPTY_DETAILS: DetailsState = {
  name: "",
  email: "",
  dialCode: "+91",
  customDialCode: "",
  phone: "",
  preferredLanguage: "",
  birthDate: "",
  birthTime: "",
  birthTimeAccuracy: "exact",
  birthPlace: "",
  propertyType: "",
  entranceFacing: "",
  floorPlan: null,
  gender: "unspecified",
  genderSelf: "",
  marketingConsent: false,
};

export type FlowAction =
  | { type: "go"; step: StepIndex }
  | { type: "next" }
  | { type: "back" }
  | { type: "service"; slug: string }
  | { type: "mode"; mode: BookingMode }
  | { type: "tz"; tz: string; chosen: boolean }
  | { type: "month"; month: string }
  | { type: "day"; day: string | null }
  | { type: "slot"; slot: Slot | null }
  | { type: "details"; patch: Partial<DetailsState> }
  | { type: "question"; text: string }
  | { type: "submit:start" }
  | { type: "submit:fail"; failure: SubmitFailure }
  | { type: "submit:ok"; receipt: BookingReceipt }
  | { type: "dismiss-failure" };

export function initialFlowState(input: {
  serviceSlug: string | null;
  clientTz: string;
  month: string;
  dialCode?: string;
}): FlowState {
  return {
    step: serviceSlugStep(input.serviceSlug),
    reached: serviceSlugStep(input.serviceSlug),
    serviceSlug: input.serviceSlug,
    mode: null,
    clientTz: input.clientTz,
    tzChosen: false,
    month: input.month,
    day: null,
    slot: null,
    details: { ...EMPTY_DETAILS, dialCode: input.dialCode ?? EMPTY_DETAILS.dialCode },
    question: "",
    submitting: false,
    failure: null,
    receipt: null,
  };
}

const serviceSlugStep = (slug: string | null): StepIndex => (slug ? 1 : 0);

const clamp = (n: number): StepIndex => Math.min(STEP_COUNT - 1, Math.max(0, n)) as StepIndex;

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "go": {
      if (action.step > state.reached) return state;
      return { ...state, step: action.step, failure: null };
    }
    case "next": {
      const step = clamp(state.step + 1);
      return { ...state, step, reached: clamp(Math.max(state.reached, step)), failure: null };
    }
    case "back":
      return { ...state, step: clamp(state.step - 1), failure: null };
    case "service": {
      if (action.slug === state.serviceSlug) return state;
      // A different service has different modes, durations and slots: reset what depends on it.
      return {
        ...state,
        serviceSlug: action.slug,
        mode: null,
        day: null,
        slot: null,
        reached: 1,
        failure: null,
      };
    }
    case "mode":
      return { ...state, mode: action.mode };
    case "tz": {
      if (action.tz === state.clientTz) return state;
      // Client-local dates shift with the zone, so the chosen day and slot no longer apply.
      return { ...state, clientTz: action.tz, tzChosen: action.chosen, day: null, slot: null };
    }
    case "month":
      return { ...state, month: action.month };
    case "day":
      return { ...state, day: action.day, slot: null };
    case "slot":
      return { ...state, slot: action.slot };
    case "details":
      return { ...state, details: { ...state.details, ...action.patch } };
    case "question":
      return { ...state, question: action.text };
    case "submit:start":
      return { ...state, submitting: true, failure: null };
    case "submit:fail":
      return { ...state, submitting: false, failure: action.failure };
    case "submit:ok":
      return {
        ...state,
        submitting: false,
        failure: null,
        receipt: action.receipt,
        step: 6,
        reached: 6,
      };
    case "dismiss-failure":
      return { ...state, failure: null };
  }
}
