/**
 * Redirect rule matching (Phase 6, P6-B). Pure — no database, no Next imports — so the proxy,
 * the admin validators and the unit tests share one implementation.
 *
 *   exact     `/old-page`            matches that path only (trailing slash tolerated)
 *   wildcard  `/old/*`               `*` matches any run of characters incl. `/`; captured as
 *                                    `$1`/`:splat` in the destination
 *   regex     `^/old/(\d+)$`         JavaScript regex source; `$1`… in the destination
 *
 * Regex rules are the only ones that can be abused (ReDoS). `validatePattern()` rejects
 * patterns that are too long, contain nested quantifiers, quantified groups that end in a
 * quantifier, or back-references — the shapes behind catastrophic backtracking — and every
 * compiled regex is anchored so it can only ever match a whole pathname.
 */
import type { RedirectMatchType } from "@/db/schema/redirects";

export const MAX_PATTERN_LENGTH = 512;
export const MAX_DESTINATION_LENGTH = 2048;

export interface RedirectRule {
  id: string;
  fromPath: string;
  toPath: string | null;
  matchType: RedirectMatchType;
  statusCode: number;
}

export interface RedirectMatch {
  rule: RedirectRule;
  /** Resolved destination (captures substituted); `null` for 410. */
  destination: string | null;
  statusCode: number;
}

/** Strip a trailing slash (except on `/`), collapse duplicate slashes, drop the query/hash. */
export function normalisePathname(pathname: string): string {
  let path = pathname.split(/[?#]/)[0] ?? "/";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

const ESCAPE_RE = /[.+?^${}()|[\]\\]/g;

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE, "\\$&");
}

/** A wildcard pattern becomes an anchored regex with one capture group per `*`. */
export function wildcardToRegex(pattern: string): RegExp {
  const source = pattern.split("*").map(escapeRegex).join("(.*)");
  return new RegExp(`^${source}$`);
}

/**
 * Catastrophic-backtracking detection. Every known blow-up shape is a group that is itself
 * quantified without an upper bound (`)+`, `)*`, `){2,}`) whose body can match the same text
 * in more than one way — an unbounded quantifier inside (`(a+)+`, `(\w+\s?)*`) or an
 * alternation inside (`(x|xx)+`). `scanUnsafeGroups()` walks the source once, respecting
 * escapes and character classes, so it is not fooled by `\(` or `[()]`.
 */
function openEndedQuantifierAt(source: string, index: number): boolean {
  const ch = source[index];
  if (ch === "*" || ch === "+") return true;
  if (ch !== "{") return false;
  const close = source.indexOf("}", index);
  if (close === -1) return false;
  return /^\{\d*,\s*\}$/.test(source.slice(index, close + 1));
}

/** True when a group body can match one string in several ways (alternation or `*`/`+`/`{n,}`). */
function bodyIsAmbiguous(body: string): boolean {
  let inClass = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      continue;
    }
    if (ch === "|") return true;
    if (i > 0 && openEndedQuantifierAt(body, i)) return true;
  }
  return false;
}

export function scanUnsafeGroups(source: string): boolean {
  const stack: number[] = [];
  let inClass = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      continue;
    }
    if (ch === "(") {
      stack.push(i);
      continue;
    }
    if (ch === ")") {
      const start = stack.pop();
      if (start === undefined) continue;
      if (!openEndedQuantifierAt(source, i + 1)) continue;
      if (bodyIsAmbiguous(source.slice(start + 1, i))) return true;
    }
  }
  return false;
}

/** Three or more unbounded wildcards in a row (`.*.*.*`) backtrack quadratically on a miss. */
const ADJACENT_UNBOUNDED = /(?:\.[*+]\??){3,}|(?:\[[^\]]*\][*+]\??){3,}/;
/** Back-references make matching NP-hard in the worst case; a redirect never needs one. */
const BACKREFERENCE = /\\[1-9]|\\k</;

export type PatternProblem =
  "empty" | "too_long" | "not_absolute" | "invalid_regex" | "unsafe_regex" | "no_wildcard";

/** `null` when the pattern is acceptable for its match type, otherwise the problem. */
export function validatePattern(
  pattern: string,
  matchType: RedirectMatchType,
): PatternProblem | null {
  if (!pattern.trim()) return "empty";
  if (pattern.length > MAX_PATTERN_LENGTH) return "too_long";
  if (matchType === "regex") {
    if (
      scanUnsafeGroups(pattern) ||
      ADJACENT_UNBOUNDED.test(pattern) ||
      BACKREFERENCE.test(pattern)
    ) {
      return "unsafe_regex";
    }
    try {
      new RegExp(pattern);
    } catch {
      return "invalid_regex";
    }
    return null;
  }
  if (!pattern.startsWith("/")) return "not_absolute";
  if (matchType === "wildcard" && !pattern.includes("*")) return "no_wildcard";
  return null;
}

/** Anchored regex for a regex rule; `^`/`$` are added when the author left them out. */
export function compileRegexRule(source: string): RegExp {
  const anchored = `${source.startsWith("^") ? "" : "^"}${source}${source.endsWith("$") ? "" : "$"}`;
  return new RegExp(anchored);
}

/** Replace `$1`…`$9` and `:splat` (first capture) in a destination template. */
export function substituteCaptures(template: string, captures: readonly string[]): string {
  return template
    .replace(/\$(\d)/g, (_, n: string) => captures[Number(n) - 1] ?? "")
    .replace(/:splat/g, captures[0] ?? "");
}

export interface CompiledPatternRule {
  rule: RedirectRule;
  regex: RegExp;
}

export function compilePatternRule(rule: RedirectRule): CompiledPatternRule | null {
  if (validatePattern(rule.fromPath, rule.matchType)) return null;
  if (rule.matchType === "wildcard") return { rule, regex: wildcardToRegex(rule.fromPath) };
  if (rule.matchType === "regex") return { rule, regex: compileRegexRule(rule.fromPath) };
  return null;
}

/** Resolve the destination for a matched rule (captures substituted, 410 → `null`). */
export function resolveDestination(
  rule: RedirectRule,
  captures: readonly string[] = [],
): string | null {
  if (rule.statusCode === 410 || !rule.toPath) return null;
  const target = captures.length ? substituteCaptures(rule.toPath, captures) : rule.toPath;
  return target.length > MAX_DESTINATION_LENGTH ? target.slice(0, MAX_DESTINATION_LENGTH) : target;
}

/** A destination is a site path, or an absolute http(s) URL (off-site redirects are allowed). */
export function isValidDestination(value: string): boolean {
  if (!value || value.length > MAX_DESTINATION_LENGTH) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
