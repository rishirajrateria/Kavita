import { check, equal } from "../seo-plumbing/_assert";
import { contactSchema, HONEYPOT_FIELD } from "@/lib/validation/contact";
import { testimonialSchema } from "@/lib/validation/testimonial";

const validContact = {
  name: "Asha Rao",
  email: "asha@example.com",
  dialCode: "+91",
  phone: "98765 43210",
  message: "I would like to book an integrated reading for my new flat in Pune.",
};

const validTestimonial = {
  name: "Asha Rao",
  email: "asha@example.com",
  location: "Pune, India",
  serviceSlug: "integrated-life-reading",
  rating: "5",
  experience:
    "The reading was calm and specific, and the vastu notes for our flat were practical and easy to act on.",
  consent: "on",
};

export function run() {
  // --- contact: accept -----------------------------------------------------------------------
  const ok = contactSchema.safeParse(validContact);
  check(ok.success, "contact: valid body accepted");
  if (ok.success) {
    equal(ok.data.phone, "+91 9876543210", "contact: phone normalised with dial code");
    equal(ok.data.name, "Asha Rao", "contact: name kept");
  }
  const noPhone = contactSchema.safeParse({ ...validContact, phone: "" });
  check(noPhone.success && noPhone.data.phone === null, "contact: empty phone → null");
  const other = contactSchema.safeParse({
    ...validContact,
    dialCode: "other",
    customDialCode: "+49",
    phone: "170 1234567",
  });
  check(other.success && other.data.phone === "+49 1701234567", "contact: other dial code");
  const formEncoded = contactSchema.safeParse({ ...validContact, [HONEYPOT_FIELD]: "" });
  check(formEncoded.success, "contact: empty honeypot accepted");

  // --- contact: reject -----------------------------------------------------------------------
  const cases: [string, Record<string, unknown>][] = [
    ["missing name", { ...validContact, name: "" }],
    ["short name", { ...validContact, name: "A" }],
    ["bad email", { ...validContact, email: "not-an-email" }],
    ["short message", { ...validContact, message: "hi" }],
    ["long message", { ...validContact, message: "x".repeat(4001) }],
    ["letters in phone", { ...validContact, phone: "call me" }],
    ["too-long phone", { ...validContact, phone: "1234567890123456" }],
    ["other without code", { ...validContact, dialCode: "other", customDialCode: "" }],
    ["bad custom code", { ...validContact, dialCode: "other", customDialCode: "49" }],
    ["unknown dial code", { ...validContact, dialCode: "+999" }],
    ["honeypot filled", { ...validContact, [HONEYPOT_FIELD]: "http://spam.example" }],
  ];
  for (const [label, body] of cases) {
    check(!contactSchema.safeParse(body).success, `contact: rejects ${label}`);
  }
  const bad = contactSchema.safeParse({ ...validContact, email: "nope" });
  check(
    !bad.success && bad.error.issues.some((i) => i.path[0] === "email"),
    "contact: error path names the field",
  );

  // --- testimonial: accept -------------------------------------------------------------------
  const t = testimonialSchema.safeParse(validTestimonial);
  check(t.success, "testimonial: valid body accepted");
  if (t.success) {
    equal(t.data.consent, true, "testimonial: 'on' → consent true");
    equal(t.data.rating, 5, "testimonial: rating string → number");
    equal(t.data.serviceSlug, "integrated-life-reading", "testimonial: slug kept");
  }
  const { consent: _c, rating: _r, ...withoutKeys } = validTestimonial;
  const missing = testimonialSchema.safeParse(withoutKeys);
  check(
    missing.success && missing.data.consent === false && missing.data.rating === undefined,
    "testimonial: missing consent/rating keys (unticked box, JSON without them) accepted",
  );
  const noConsent = testimonialSchema.safeParse({ ...validTestimonial, consent: undefined });
  check(noConsent.success && noConsent.data.consent === false, "testimonial: no box → false");
  const jsonConsent = testimonialSchema.safeParse({ ...validTestimonial, consent: true });
  check(jsonConsent.success && jsonConsent.data.consent === true, "testimonial: JSON true");
  const noRating = testimonialSchema.safeParse({ ...validTestimonial, rating: "" });
  check(noRating.success && noRating.data.rating === undefined, "testimonial: empty rating");
  const noService = testimonialSchema.safeParse({ ...validTestimonial, serviceSlug: "" });
  check(
    noService.success && noService.data.serviceSlug === undefined,
    "testimonial: empty service → undefined",
  );

  // --- testimonial: reject -------------------------------------------------------------------
  const tCases: [string, Record<string, unknown>][] = [
    ["rating 0", { ...validTestimonial, rating: "0" }],
    ["rating 6", { ...validTestimonial, rating: 6 }],
    ["rating 4.5", { ...validTestimonial, rating: "4.5" }],
    ["short experience", { ...validTestimonial, experience: "Great." }],
    ["bad slug", { ...validTestimonial, serviceSlug: "Not A Slug!" }],
    ["missing location", { ...validTestimonial, location: "" }],
    ["honeypot filled", { ...validTestimonial, [HONEYPOT_FIELD]: "x" }],
  ];
  for (const [label, body] of tCases) {
    check(!testimonialSchema.safeParse(body).success, `testimonial: rejects ${label}`);
  }
}
