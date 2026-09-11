/**
 * Route-pattern specificity and the custom-head sanitiser (Phase 6 P6-A). Pure, no database.
 */
import { check, equal } from "../seo-plumbing/_assert";
import {
  matchingByPrecedence,
  normalisePattern,
  patternMatches,
  patternSpecificity,
  pickMostSpecific,
} from "@/lib/seo/route-pattern";
import { sanitizeHeadHtml } from "@/lib/seo/sanitize-head";

export function run() {
  // --- matching -------------------------------------------------------------------------------
  check(patternMatches("/about", "/about"), "exact pattern matches its route");
  check(!patternMatches("/about", "/about/team"), "exact pattern does not match a child");
  check(patternMatches("/about/", "/about"), "trailing slashes are normalised away");
  check(
    patternMatches("/astrologer/india/*", "/astrologer/india/maharashtra/mumbai"),
    "a glob crosses slashes",
  );
  check(
    !patternMatches("/astrologer/india/*", "/astrologer/united-states/texas"),
    "a glob does not match a sibling branch",
  );
  check(patternMatches("*", "/anything/at/all"), "bare * matches everything");
  equal(normalisePattern("*"), "/*", "bare * normalises to /*");

  // --- specificity ----------------------------------------------------------------------------
  const route = "/astrologer/india/maharashtra/mumbai";
  const exact = patternSpecificity(route, route);
  const deep = patternSpecificity("/astrologer/india/maharashtra/*", route);
  const shallow = patternSpecificity("/astrologer/india/*", route);
  const everything = patternSpecificity("/*", route);
  check(exact !== null && deep !== null && shallow !== null && everything !== null, "all match");
  check((exact ?? 0) > (deep ?? 0), "exact beats the deepest glob");
  check((deep ?? 0) > (shallow ?? 0), "the longer literal prefix wins");
  check((shallow ?? 0) > (everything ?? 0), "any prefix beats /*");
  equal(patternSpecificity("/vastu-consultant/*", route), null, "a non-matching glob scores null");

  const candidates = [
    { p: "/*" },
    { p: "/astrologer/india/*" },
    { p: route },
    { p: "/astrologer/india/maharashtra/*" },
  ];
  equal(
    pickMostSpecific(candidates, route, (c) => c.p)?.p,
    route,
    "pickMostSpecific returns the exact row",
  );
  equal(
    matchingByPrecedence(candidates, route, (c) => c.p)
      .map((c) => c.p)
      .join(" > "),
    `${route} > /astrologer/india/maharashtra/* > /astrologer/india/* > /*`,
    "precedence order is exact, then longest prefix",
  );
  // Determinism: equal scores keep input order.
  const tie = [{ p: "/a/*" }, { p: "/a/*" }];
  equal(
    matchingByPrecedence(tie, "/a/b", (c) => c.p).length,
    2,
    "ties keep both candidates, in input order",
  );

  // --- sanitiser ------------------------------------------------------------------------------
  const ok = sanitizeHeadHtml(
    `<meta name="verify" content="abc">
     <link rel="alternate" hreflang="en-IN" href="https://example.com/x">
     <script type="application/ld+json">{"@type":"Organization"}</script>`,
  );
  equal(ok.tags.length, 3, "meta, link and JSON-LD all survive");
  equal(ok.warnings.length, 0, "nothing is warned about for a clean snippet");
  check(ok.html.includes('<meta name="verify" content="abc">'), "meta is re-serialised");

  const dirty = sanitizeHeadHtml(
    `<script>alert(1)</script>
     <meta name="x" content="y" onload="steal()">
     <link rel="stylesheet" href="https://evil.example/x.css">
     <link rel="canonical" href="javascript:alert(1)">
     <div>hello</div>
     <!-- comment -->
     <script type="application/ld+json">{ not json }</script>`,
  );
  check(!dirty.html.includes("alert("), "no script body survives the sanitiser");
  check(!dirty.html.includes("onload"), "event handlers are stripped");
  check(!dirty.html.includes("stylesheet"), "rel=stylesheet is refused");
  check(!dirty.html.includes("javascript:"), "javascript: URLs are refused");
  check(!dirty.html.includes("<div"), "unknown tags are dropped");
  check(
    dirty.warnings.some((w) => w.includes("not valid JSON")),
    "bad JSON-LD is reported",
  );
  check(
    dirty.warnings.some((w) => w.includes("event handler")),
    "the removed handler is reported",
  );
  equal(sanitizeHeadHtml(null).html, "", "null input is empty output");

  // A meta without name/property/http-equiv is meaningless and is dropped.
  equal(sanitizeHeadHtml('<meta content="x">').tags.length, 0, "meta needs a name or property");
  equal(
    sanitizeHeadHtml('<meta http-equiv="refresh" content="0;url=/x">').tags.length,
    0,
    "http-equiv (meta refresh) is refused",
  );
}
