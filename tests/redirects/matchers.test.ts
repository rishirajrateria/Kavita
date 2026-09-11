/**
 * Matcher safety and semantics (Phase 6, P6-B): path normalisation, wildcard and regex
 * compilation, capture substitution and — the one that matters for a public endpoint — the
 * refusal of regex shapes that can backtrack catastrophically.
 */
import { check, equal } from "../seo-plumbing/_assert";
import {
  compileRegexRule,
  isValidDestination,
  normalisePathname,
  resolveDestination,
  substituteCaptures,
  validatePattern,
  wildcardToRegex,
  type RedirectRule,
} from "@/lib/redirects/matchers";

const rule = (over: Partial<RedirectRule> = {}): RedirectRule => ({
  id: "r1",
  fromPath: "/old",
  toPath: "/new",
  matchType: "exact",
  statusCode: 301,
  ...over,
});

export function run(): void {
  // --- normalisation ---
  equal(normalisePathname("/a/"), "/a", "trailing slash stripped");
  equal(normalisePathname("/"), "/", "root keeps its slash");
  equal(normalisePathname("//a//b"), "/a/b", "duplicate slashes collapsed");
  equal(normalisePathname("/a?x=1#y"), "/a", "query and hash dropped");
  equal(normalisePathname("a/b"), "/a/b", "leading slash added");

  // --- wildcards ---
  const w = wildcardToRegex("/blog/*");
  check(w.test("/blog/one/two"), "wildcard spans slashes");
  check(!w.test("/blogger/one"), "wildcard is anchored at the prefix");
  equal(w.exec("/blog/one/two")?.[1], "one/two", "wildcard captures the tail");
  const dotted = wildcardToRegex("/a.b/*");
  check(!dotted.test("/axb/c"), "literal dot is escaped");

  // --- regex anchoring ---
  const anchored = compileRegexRule("/item/(\\d+)");
  check(anchored.source.startsWith("^") && anchored.source.endsWith("$"), "regex is anchored");
  check(!anchored.test("/shop/item/12"), "unanchored prefix cannot match");
  equal(anchored.exec("/item/12")?.[1], "12", "regex captures");

  // --- capture substitution ---
  equal(substituteCaptures("/new/$1", ["a/b"]), "/new/a/b", "$1 substituted");
  equal(substituteCaptures("/new/:splat", ["x"]), "/new/x", ":splat substituted");
  equal(substituteCaptures("/new/$2", ["a"]), "/new/", "missing capture becomes empty");
  equal(
    resolveDestination(rule({ matchType: "wildcard", fromPath: "/o/*", toPath: "/n/$1" }), ["z"]),
    "/n/z",
    "destination resolved with captures",
  );
  equal(
    resolveDestination(rule({ statusCode: 410, toPath: null })),
    null,
    "410 has no destination",
  );

  // --- validation ---
  equal(validatePattern("", "exact"), "empty", "empty source refused");
  equal(validatePattern("old-page", "exact"), "not_absolute", "relative source refused");
  equal(validatePattern("/old", "wildcard"), "no_wildcard", "wildcard rule needs a *");
  equal(validatePattern("/a".repeat(400), "exact"), "too_long", "over-long source refused");
  equal(validatePattern("^/ok/(\\d+)$", "regex"), null, "sane regex accepted");
  equal(validatePattern("^/a(+$", "regex"), "invalid_regex", "unparseable regex refused");
  // The safety scan must not reject the patterns a site actually needs.
  equal(validatePattern("^/city/([a-z-]+)$", "regex"), null, "a single quantified class is fine");
  equal(validatePattern("^/(?:en|hi)/(.+)$", "regex"), null, "an unquantified alternation is fine");
  equal(validatePattern("^/blog/(\\d{4})/(.+)$", "regex"), null, "a bounded repetition is fine");

  // Catastrophic backtracking shapes must never reach `new RegExp` in the request path.
  const evil = [
    "^(a+)+$",
    "^(a*)*$",
    "^([a-z]+)+$",
    "^(\\w+\\s?)*$",
    "^/(x|xx)+$",
    "^/.*.*.*$",
    "^/(a)\\1$",
  ];
  for (const source of evil) {
    equal(
      validatePattern(source, "regex"),
      "unsafe_regex",
      `catastrophic regex refused: ${source}`,
    );
  }

  // --- destinations ---
  check(isValidDestination("/new"), "site path is a valid destination");
  check(isValidDestination("https://example.com/x"), "https URL is a valid destination");
  check(!isValidDestination("//evil.example"), "protocol-relative destination refused");
  check(!isValidDestination("javascript:alert(1)"), "javascript: destination refused");
  check(!isValidDestination(""), "empty destination refused");
}
