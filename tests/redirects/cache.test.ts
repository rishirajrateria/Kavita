/**
 * Redirect cache performance and precedence (Phase 6, P6-B). The proxy consults the index on
 * every page request, so the contract is a lookup well under 5 ms with 5,000 active rules —
 * measured here over 2,000 lookups (hits and misses) against a built index.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { buildRedirectIndex, lookupInIndex } from "@/lib/redirects/cache";
import type { RedirectRule } from "@/lib/redirects/matchers";

const RULES = 5000;
/** Per-lookup budget in milliseconds (CLAUDE.md Phase 6 contract). */
const BUDGET_MS = 5;

function corpus(): RedirectRule[] {
  const rules: RedirectRule[] = [];
  for (let i = 0; i < RULES - 20; i += 1) {
    rules.push({
      id: `exact-${i}`,
      fromPath: `/old/page-${i}`,
      toPath: `/new/page-${i}`,
      matchType: "exact",
      statusCode: 301,
    });
  }
  for (let i = 0; i < 19; i += 1) {
    rules.push({
      id: `wild-${i}`,
      fromPath: `/legacy-${i}/*`,
      toPath: `/new-${i}/$1`,
      matchType: "wildcard",
      statusCode: 301,
    });
  }
  rules.push({
    id: "regex-0",
    fromPath: "^/archive/(\\d{4})/(.+)$",
    toPath: "/learn/$2",
    matchType: "regex",
    statusCode: 308,
  });
  return rules;
}

export function run(): void {
  const rules = corpus();
  const index = buildRedirectIndex(rules);
  equal(index.size, RULES, "every rule is indexed");
  equal(index.exact.size, RULES - 20, "exact rules go in the map");
  equal(index.patterns.length, 20, "pattern rules are compiled");

  // --- semantics ---
  equal(lookupInIndex(index, "/old/page-42")?.destination, "/new/page-42", "exact hit");
  equal(lookupInIndex(index, "/old/page-42/")?.destination, "/new/page-42", "trailing slash hit");
  equal(
    lookupInIndex(index, "/legacy-3/a/b")?.destination,
    "/new-3/a/b",
    "wildcard hit with splat",
  );
  equal(
    lookupInIndex(index, "/archive/2019/mars-retrograde")?.destination,
    "/learn/mars-retrograde",
    "regex hit with capture",
  );
  equal(lookupInIndex(index, "/no/such/path"), null, "miss returns null");

  // An exact rule wins over a wildcard that would also match.
  const mixed = buildRedirectIndex([
    { id: "w", fromPath: "/a/*", toPath: "/wild/$1", matchType: "wildcard", statusCode: 301 },
    { id: "e", fromPath: "/a/b", toPath: "/exact", matchType: "exact", statusCode: 301 },
  ]);
  equal(lookupInIndex(mixed, "/a/b")?.destination, "/exact", "exact beats wildcard");
  equal(lookupInIndex(mixed, "/a/c")?.destination, "/wild/c", "wildcard still matches the rest");

  // A 410 rule resolves to no destination; the proxy turns that into the /gone page.
  const gone = buildRedirectIndex([
    { id: "g", fromPath: "/removed", toPath: null, matchType: "exact", statusCode: 410 },
  ]);
  const goneMatch = lookupInIndex(gone, "/removed");
  equal(goneMatch?.statusCode, 410, "410 status preserved");
  equal(goneMatch?.destination, null, "410 has no destination");

  // --- performance ---
  const paths: string[] = [];
  for (let i = 0; i < 2000; i += 1) {
    if (i % 4 === 0) paths.push(`/old/page-${i % (RULES - 20)}`);
    else if (i % 4 === 1) paths.push(`/legacy-${i % 19}/deep/path/${i}`);
    else if (i % 4 === 2) paths.push(`/archive/2020/article-${i}`);
    else paths.push(`/definitely/not/a/rule/${i}`);
  }
  // Warm up so the first-call JIT cost is not charged to the measurement.
  for (const p of paths) lookupInIndex(index, p);
  const started = performance.now();
  for (const p of paths) lookupInIndex(index, p);
  const perLookup = (performance.now() - started) / paths.length;
  check(
    perLookup < BUDGET_MS,
    `lookup must stay under ${BUDGET_MS} ms with ${RULES} rules (was ${perLookup.toFixed(4)} ms)`,
  );

  // Building the index for 5,000 rules must also be cheap — it happens on a cold request.
  const buildStart = performance.now();
  buildRedirectIndex(rules);
  const buildMs = performance.now() - buildStart;
  check(buildMs < 250, `index build stays quick (was ${buildMs.toFixed(1)} ms)`);
}
