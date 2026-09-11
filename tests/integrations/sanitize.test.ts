/**
 * The custom head/body sanitiser and the ID/URL validators (CLAUDE.md §13C). The sanitiser is a
 * guard rail for a trusted admin, not a defence against a hostile author — what it must do is
 * strip inline handlers, script URLs and elements that have no business in a tag snippet, and
 * say what it removed so the admin sees a warning.
 */
import { check, equal, excludes, includes } from "../seo-plumbing/_assert";
import { sanitizeCustomHtml } from "@/lib/integrations/sanitize";
import {
  validateGa4MeasurementId,
  validateGoogleAdsConversionId,
  validateGoogleTagId,
  validateGscProperty,
  validateGtmContainerId,
  validateHttpsUrl,
  validateMetaPixelId,
  validateServiceAccountJson,
  validateTikTokPixelId,
  validateUetTagId,
  parseRegionList,
} from "@/lib/integrations/validators";
import {
  validateFilePath,
  validateMetaContent,
  validateMetaName,
  VERIFICATION_FILE_PATTERN,
} from "@/lib/integrations/verification";
import { parseParamLines } from "@/app/api/admin/integrations/mappings/route";

export function run() {
  // ---- sanitiser -------------------------------------------------------------------------
  const script = sanitizeCustomHtml('<script src="https://cdn.example.com/a.js"></script>', "head");
  includes(script.html, "https://cdn.example.com/a.js", "sanitize: a plain script survives");
  check(!script.changed, "sanitize: an already-clean snippet is unchanged");

  const handler = sanitizeCustomHtml('<img src="/p.gif" onerror="steal()">', "body");
  excludes(handler.html, "onerror", "sanitize: inline handlers are stripped");
  check(handler.warnings.length > 0, "sanitize: removing a handler raises a warning");

  const jsUrl = sanitizeCustomHtml('<link rel="x" href="javascript:alert(1)">', "head");
  excludes(jsUrl.html, "javascript:", "sanitize: javascript: URLs are stripped");
  const spaced = sanitizeCustomHtml('<link rel="x" href="java\tscript:alert(1)">', "head");
  excludes(spaced.html, "alert", "sanitize: whitespace-obfuscated script URLs are stripped");

  const form = sanitizeCustomHtml("<form action='/x'><input name='a'></form>", "body");
  equal(form.html, "", "sanitize: a form is removed with its contents");

  const iframe = sanitizeCustomHtml('<iframe src="http://example.com"></iframe>', "body");
  excludes(iframe.html, "src=", "sanitize: a non-https iframe src is dropped");
  const headIframe = sanitizeCustomHtml('<iframe src="https://example.com"></iframe>', "head");
  equal(headIframe.html, "", "sanitize: an iframe is not allowed in the head at all");

  const comment = sanitizeCustomHtml(
    "<!-- <script>bad()</script> --><meta name=a content=b>",
    "head",
  );
  excludes(comment.html, "bad()", "sanitize: comments (and what hides in them) are removed");
  includes(comment.html, "<meta", "sanitize: a meta tag survives in the head");

  // ---- ID validators ----------------------------------------------------------------------
  equal(validateMetaPixelId("123456789012345"), null, "validators: a Meta pixel id passes");
  check(validateMetaPixelId("abc") !== null, "validators: a non-numeric pixel id fails");
  equal(validateGa4MeasurementId("G-ABCDE12345"), null, "validators: a GA4 id passes");
  check(
    validateGa4MeasurementId("UA-12345-1") !== null,
    "validators: a Universal Analytics id fails",
  );
  equal(validateGoogleAdsConversionId("AW-123456789"), null, "validators: an Ads id passes");
  equal(validateGoogleTagId("GT-ABC1234"), null, "validators: a Google tag id passes");
  equal(validateGtmContainerId("GTM-ABC1234"), null, "validators: a GTM container id passes");
  check(validateGtmContainerId("GTM") !== null, "validators: a truncated GTM id fails");
  equal(validateUetTagId("12345678"), null, "validators: a UET id passes");
  equal(validateTikTokPixelId("C1A2B3C4D5E6F7G8H9I0"), null, "validators: a TikTok id passes");
  equal(validateHttpsUrl("https://example.com/"), null, "validators: an https URL passes");
  check(validateHttpsUrl("http://example.com/") !== null, "validators: a plain http URL fails");
  equal(validateGscProperty("sc-domain:example.com"), null, "validators: a domain property passes");
  check(
    validateServiceAccountJson('{"client_email":"a@b.iam.gserviceaccount.com"}') !== null,
    "validators: a service-account key without a private key fails",
  );
  equal(
    validateServiceAccountJson(
      '{"client_email":"a@b.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\nx"}',
    ),
    null,
    "validators: a complete service-account key passes",
  );

  // ---- region lists -------------------------------------------------------------------------
  const regions = parseRegionList("in, ae ; GB");
  equal(regions.regions.join(","), "IN,AE,GB", "validators: region codes are upper-cased");
  equal(regions.error, null, "validators: a clean region list has no error");
  check(parseRegionList("India").error !== null, "validators: a country name is rejected");

  // ---- verification ---------------------------------------------------------------------------
  equal(validateMetaName("google-site-verification"), null, "verification: meta name accepted");
  equal(validateMetaContent("abc123_-=/."), null, "verification: meta content accepted");
  check(validateMetaContent("<meta name=x>") !== null, "verification: a whole tag is rejected");
  equal(validateFilePath("google1a2b3c4d5e6f.html"), null, "verification: a Google file passes");
  equal(validateFilePath("/BingSiteAuth.xml"), null, "verification: BingSiteAuth.xml passes");
  check(validateFilePath("/anything.html") !== null, "verification: an arbitrary name is refused");
  check(
    !VERIFICATION_FILE_PATTERN.test("/../../etc/passwd"),
    "verification: traversal never matches the allow-list",
  );

  // ---- mapping parameter lines ------------------------------------------------------------------
  const params = parseParamLines("content_name={serviceSlug}\n  \nlabel=AbCd");
  equal(params.error, null, "mappings: a clean parameter block parses");
  equal(params.params.content_name, "{serviceSlug}", "mappings: a placeholder survives");
  equal(params.params.label, "AbCd", "mappings: a literal survives");
  check(parseParamLines("just a sentence").error !== null, "mappings: a non key=value line fails");
  check(parseParamLines("bad key=1").error !== null, "mappings: an invalid parameter name fails");
}
