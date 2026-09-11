/**
 * Route-pattern matching shared by `page_seo` and `faq_attachments` (Phase 6 P6-A). Pure.
 *
 * A pattern is an exact route (`/about`) or a glob where `*` matches any run of characters,
 * `/` included (`/astrologer/india/*` covers every state and city under India). Specificity,
 * from highest: exact match > longest literal prefix before the first `*` > most literal
 * characters overall > fewest wildcards. `pickMostSpecific` is deterministic on ties (first
 * candidate wins), so resolution never flips between renders.
 */
import { normalisePath } from "@/lib/routes";

export const EXACT_SPECIFICITY = Number.MAX_SAFE_INTEGER;

/** True when `pattern` is a glob (contains `*`). */
export function isGlobPattern(pattern: string): boolean {
  return pattern.includes("*");
}

/** Normalise a pattern the way routes are normalised, keeping wildcards. */
export function normalisePattern(pattern: string): string {
  const trimmed = pattern.trim();
  if (trimmed === "*" || trimmed === "/*") return "/*";
  return normalisePath(trimmed);
}

function globToRegExp(pattern: string): RegExp {
  const source = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}$`);
}

/**
 * Specificity of `pattern` for `route`, or `null` when it does not match. Higher wins.
 * Exact matches return `EXACT_SPECIFICITY`; globs return a score built from the literal
 * prefix length, the total literal length and the wildcard count.
 */
export function patternSpecificity(pattern: string, route: string): number | null {
  const p = normalisePattern(pattern);
  const r = normalisePath(route);
  if (!isGlobPattern(p)) return p === r ? EXACT_SPECIFICITY : null;
  if (!globToRegExp(p).test(r)) return null;
  const prefix = p.indexOf("*");
  const wildcards = p.split("*").length - 1;
  const literal = p.length - wildcards;
  return prefix * 1_000_000 + literal * 1_000 + (999 - Math.min(wildcards, 999));
}

/** True when `pattern` matches `route` (exact or glob). */
export function patternMatches(pattern: string, route: string): boolean {
  return patternSpecificity(pattern, route) !== null;
}

/** The candidate whose pattern is most specific for `route`; `null` when none match. */
export function pickMostSpecific<T>(
  candidates: readonly T[],
  route: string,
  pattern: (candidate: T) => string,
): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = patternSpecificity(pattern(candidate), route);
    if (score !== null && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/** Every candidate matching `route`, most specific first (stable within equal scores). */
export function matchingByPrecedence<T>(
  candidates: readonly T[],
  route: string,
  pattern: (candidate: T) => string,
): T[] {
  return candidates
    .map((c, i) => ({ c, i, s: patternSpecificity(pattern(c), route) }))
    .filter((x): x is { c: T; i: number; s: number } => x.s !== null)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c);
}
