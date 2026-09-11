/**
 * Meta Conversions API payload construction (CLAUDE.md §13C) and the event-mapping defaults
 * (§13D). Two things must hold absolutely: no raw email or phone number ever leaves the server,
 * and what is written to `capi_log` carries no hash, no token and no IP.
 */
import { createHash } from "node:crypto";
import { check, equal, excludes, includes } from "../seo-plumbing/_assert";
import {
  buildMetaPayload,
  hashUserData,
  metaCookies,
  normalizeEmail,
  normalizePhone,
  sendMetaConversion,
} from "@/lib/integrations/meta-capi";
import {
  defaultEventMappings,
  findMapping,
  mergeEventMappings,
  resolveParams,
} from "@/lib/integrations/mappings";

const TEST_EVENT_CODE = "TEST12345";

export async function run() {
  // ---- normalisation and hashing -----------------------------------------------------------
  equal(normalizeEmail("  Kavita@Example.COM "), "kavita@example.com", "capi: email normalised");
  equal(normalizePhone("+91 (98765) 43210"), "919876543210", "capi: phone reduced to digits");
  equal(normalizePhone("0091-98765-43210"), "919876543210", "capi: leading zeros dropped");

  const hashed = hashUserData({ email: "Kavita@Example.com", phone: "+91 98765 43210" });
  const expectedEmail = createHash("sha256").update("kavita@example.com").digest("hex");
  equal(hashed.em?.[0], expectedEmail, "capi: email is SHA-256 of the normalised value");
  equal(hashed.em?.[0]?.length, 64, "capi: the hash is 64 hex characters");
  check(hashed.ph !== undefined, "capi: a long enough phone is hashed");
  equal(
    hashUserData({ phone: "12345" }).ph,
    undefined,
    "capi: a too-short phone is dropped rather than hashed",
  );
  equal(hashUserData({}).em, undefined, "capi: nothing invented when no contact data is given");

  // ---- payload ------------------------------------------------------------------------------
  const mapping = findMapping(defaultEventMappings(), "meta_capi", "booking_completed");
  check(mapping !== null, "capi: a default mapping exists for booking_completed");
  if (!mapping) return;

  const payload = buildMetaPayload(
    {
      internalEvent: "booking_completed",
      eventId: "booking-abc-123",
      payload: { serviceSlug: "integrated-life-reading" },
      user: { email: "Kavita@Example.com", phone: "+919876543210", ip: "203.0.113.9" },
      eventSourceUrl: "https://example.com/book",
      timestamp: 1_760_000_000_000,
    },
    mapping,
    { pixelId: "123456789012345", accessToken: "SECRET-TOKEN", testEventCode: TEST_EVENT_CODE },
  );

  includes(payload.url, "123456789012345/events", "capi: the URL targets the pixel's events edge");
  const event = (payload.body.data as Record<string, unknown>[])[0] ?? {};
  equal(event.event_name, "Schedule", "capi: booking_completed maps to Meta's Schedule");
  equal(event.event_id, "booking-abc-123", "capi: the event id is carried for de-duplication");
  equal(event.event_time, 1_760_000_000, "capi: the timestamp is unix seconds");
  equal(event.action_source, "website", "capi: the action source is the website");
  equal(payload.body.test_event_code, TEST_EVENT_CODE, "capi: the test event code is included");
  equal(
    (event.custom_data as Record<string, unknown>).content_name,
    "integrated-life-reading",
    "capi: the {serviceSlug} placeholder is resolved from the payload",
  );

  const serialised = JSON.stringify(payload.body);
  excludes(serialised, "kavita@example.com", "capi: the raw email never appears in the body");
  excludes(serialised, "Kavita@Example.com", "capi: nor in its original casing");
  excludes(serialised, "919876543210", "capi: the raw phone never appears in the body");
  includes(serialised, expectedEmail, "capi: the hashed email does appear");

  const redacted = JSON.stringify(payload.redacted);
  excludes(redacted, "SECRET-TOKEN", "capi log: the access token is redacted");
  excludes(redacted, expectedEmail, "capi log: even the hash is not logged");
  excludes(redacted, "203.0.113.9", "capi log: the IP address is redacted");
  includes(redacted, "[hashed]", "capi log: hashed fields are marked");
  includes(redacted, TEST_EVENT_CODE, "capi log: the test code is kept, so a test is identifiable");

  // ---- an unresolvable placeholder is dropped, never sent literally -------------------------
  const resolved = resolveParams({ label: "{bookingLabel}", fixed: "x" }, {});
  equal(resolved.label, undefined, "capi: an unresolved placeholder is dropped");
  equal(resolved.fixed, "x", "capi: a literal parameter survives");

  // ---- the sender refuses to send without configuration ------------------------------------
  const skipped = await sendMetaConversion(
    {
      internalEvent: "booking_completed",
      eventId: "e1",
      payload: {},
      user: { email: "a@b.com" },
    },
    {
      db: null,
      record: {
        id: "1",
        provider: "meta_capi",
        config: {},
        isEnabled: false,
        loadsInRegions: [],
        notes: null,
        lastVerifiedAt: null,
        lastTestStatus: null,
        lastTestMessage: null,
        updatedAt: new Date(),
        undecryptable: [],
      },
      fetchImpl: () => {
        throw new Error("must not be called");
      },
    },
  );
  equal(skipped.status, "skipped", "capi: a disabled Conversions API sends nothing");

  const notCapi = await sendMetaConversion(
    { internalEvent: "call_clicked", eventId: "e2", payload: {}, user: {} },
    { db: null },
  );
  equal(notCapi.status, "skipped", "capi: only the three server-side events are sent");

  // ---- cookies --------------------------------------------------------------------------------
  const cookies = metaCookies("_fbp=fb.1.1700000000000.1234567890; other=1");
  equal(cookies.fbp, "fb.1.1700000000000.1234567890", "capi: _fbp is read from the cookie header");
  equal(cookies.fbc, null, "capi: a missing _fbc stays null");
  equal(metaCookies("_fbp=nonsense").fbp, null, "capi: a malformed _fbp is ignored");

  // ---- mapping defaults ------------------------------------------------------------------------
  const defaults = defaultEventMappings();
  equal(
    findMapping(defaults, "meta_pixel", "booking_completed")?.providerEvent,
    "Schedule",
    "mappings: booking_completed → Meta Schedule",
  );
  equal(
    findMapping(defaults, "meta_pixel", "contact_submitted")?.providerEvent,
    "Contact",
    "mappings: contact_submitted → Meta Contact",
  );
  equal(
    findMapping(defaults, "meta_pixel", "whatsapp_clicked")?.providerEvent,
    "Contact",
    "mappings: whatsapp_clicked → Meta Contact",
  );
  equal(
    findMapping(defaults, "meta_pixel", "booking_started")?.providerEvent,
    "InitiateCheckout",
    "mappings: booking_started → Meta InitiateCheckout",
  );
  equal(
    findMapping(defaults, "ga4", "booking_completed")?.providerEvent,
    "generate_lead",
    "mappings: booking_completed → GA4 generate_lead",
  );
  equal(
    findMapping(defaults, "ga4", "booking_started")?.providerEvent,
    "begin_checkout",
    "mappings: booking_started → GA4 begin_checkout",
  );
  equal(
    findMapping(defaults, "google_ads", "booking_completed")?.params.label,
    "{bookingLabel}",
    "mappings: Google Ads carries the conversion label placeholder",
  );
  check(
    defaults.every((m) => !m.custom),
    "mappings: built-in rows are not marked custom",
  );

  // ---- overrides layer on top ---------------------------------------------------------------
  const merged = mergeEventMappings([
    {
      provider: "meta_pixel",
      internalEvent: "booking_completed",
      providerEvent: "Purchase",
      params: { value: 1 },
      isEnabled: true,
    },
    {
      provider: "meta_pixel",
      internalEvent: "not_an_event",
      providerEvent: "X",
      params: null,
      isEnabled: true,
    },
  ]);
  const overridden = findMapping(merged, "meta_pixel", "booking_completed");
  equal(overridden?.providerEvent, "Purchase", "mappings: a stored row overrides the default");
  check(overridden?.custom === true, "mappings: an override is marked custom");
  equal(
    merged.filter((m) => (m.internalEvent as string) === "not_an_event").length,
    0,
    "mappings: an unknown internal event in the database is ignored",
  );
  equal(
    findMapping(merged, "ga4", "contact_submitted")?.providerEvent,
    "generate_lead",
    "mappings: untouched defaults survive a merge",
  );
  equal(
    findMapping(
      mergeEventMappings([
        {
          provider: "meta_pixel",
          internalEvent: "contact_submitted",
          providerEvent: "Lead",
          params: {},
          isEnabled: false,
        },
      ]),
      "meta_pixel",
      "contact_submitted",
    ),
    null,
    "mappings: a disabled mapping is never found",
  );
}
