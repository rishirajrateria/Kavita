/**
 * Loop and chain detection over exact redirect rules (Phase 6, P6-B). Pure.
 *
 * A save is refused when following the new rule's destination through the existing exact
 * rules ever returns to its source (loop). A chain is any destination that is itself
 * redirected (A → B → C); the caller warns and can collapse it (rewrite A → C), and can also
 * report the existing rules whose destination is the new source (B → A when saving A → B).
 */
import { normalisePathname, type RedirectRule } from "./matchers";

export interface ChainCheck {
  loop: boolean;
  /** Hops after the first: `[B, C]` for A → B → C. Empty when the destination is final. */
  chain: string[];
  /** The final destination (`collapse chain` rewrites the rule to point here). */
  finalDestination: string | null;
  /** Existing rules whose destination is this rule's source (they now form a chain). */
  incoming: RedirectRule[];
}

const MAX_HOPS = 10;

function exactMap(rules: readonly RedirectRule[], excludeId?: string): Map<string, RedirectRule> {
  const map = new Map<string, RedirectRule>();
  for (const rule of rules) {
    if (rule.matchType !== "exact" || rule.id === excludeId) continue;
    map.set(normalisePathname(rule.fromPath), rule);
  }
  return map;
}

/** Only site-relative destinations can chain; off-site URLs are final by definition. */
function localDestination(rule: Pick<RedirectRule, "toPath" | "statusCode">): string | null {
  if (rule.statusCode === 410 || !rule.toPath || !rule.toPath.startsWith("/")) return null;
  return normalisePathname(rule.toPath);
}

export function checkChain(
  candidate: Pick<RedirectRule, "fromPath" | "toPath" | "statusCode" | "matchType"> & {
    id?: string;
  },
  existing: readonly RedirectRule[],
): ChainCheck {
  const source = normalisePathname(candidate.fromPath);
  const map = exactMap(existing, candidate.id);
  const incoming = [...map.values()].filter((r) => localDestination(r) === source);

  const first = localDestination(candidate);
  if (candidate.matchType !== "exact" || first === null) {
    return { loop: false, chain: [], finalDestination: candidate.toPath, incoming };
  }
  if (first === source) return { loop: true, chain: [], finalDestination: null, incoming };

  const chain: string[] = [];
  const seen = new Set<string>([source]);
  let cursor = first;
  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    const next = map.get(cursor);
    if (!next) break;
    const dest = localDestination(next);
    if (dest === null) break;
    if (seen.has(dest) || dest === source) {
      return { loop: true, chain, finalDestination: null, incoming };
    }
    seen.add(dest);
    chain.push(dest);
    cursor = dest;
  }
  return { loop: false, chain, finalDestination: cursor, incoming };
}

/** Human-readable summary for the admin form. */
export function describeChain(check: ChainCheck, from: string): string | null {
  if (check.loop) return `Refused: ${from} would redirect back to itself.`;
  if (check.chain.length > 0) {
    return `Chain: ${from} → ${check.finalDestination ?? "?"} passes through ${check.chain.length} extra hop(s). Collapse it to point straight at ${check.finalDestination}.`;
  }
  if (check.incoming.length > 0) {
    return `${check.incoming.length} existing rule(s) point at ${from}; they now form a chain and can be collapsed.`;
  }
  return null;
}
