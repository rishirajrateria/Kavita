/**
 * Loop and chain detection (Phase 6, P6-B). A loop is refused at save time; a chain is
 * reported so the admin can collapse A → B → C into A → C.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { checkChain, describeChain } from "@/lib/redirects/graph";
import type { RedirectRule } from "@/lib/redirects/matchers";

const r = (id: string, from: string, to: string | null, statusCode = 301): RedirectRule => ({
  id,
  fromPath: from,
  toPath: to,
  matchType: "exact",
  statusCode,
});

export function run(): void {
  // --- direct loop ---
  const self = checkChain(
    { fromPath: "/a", toPath: "/a", statusCode: 301, matchType: "exact" },
    [],
  );
  check(self.loop, "a rule pointing at itself is a loop");
  equal(describeChain(self, "/a"), "Refused: /a would redirect back to itself.", "loop message");

  // Trailing-slash variants are the same path.
  check(
    checkChain({ fromPath: "/a", toPath: "/a/", statusCode: 301, matchType: "exact" }, []).loop,
    "trailing-slash self-reference is a loop",
  );

  // --- indirect loop: A → B where B → A already exists ---
  const indirect = checkChain(
    { fromPath: "/a", toPath: "/b", statusCode: 301, matchType: "exact" },
    [r("1", "/b", "/a")],
  );
  check(indirect.loop, "A → B with an existing B → A is a loop");

  // --- three-hop loop ---
  const threeHop = checkChain(
    { fromPath: "/a", toPath: "/b", statusCode: 301, matchType: "exact" },
    [r("1", "/b", "/c"), r("2", "/c", "/a")],
  );
  check(threeHop.loop, "A → B → C → A is a loop");

  // --- chain ---
  const chain = checkChain({ fromPath: "/a", toPath: "/b", statusCode: 301, matchType: "exact" }, [
    r("1", "/b", "/c"),
    r("2", "/c", "/d"),
  ]);
  check(!chain.loop, "a chain is not a loop");
  equal(chain.chain.length, 2, "two extra hops reported");
  equal(chain.finalDestination, "/d", "final destination is the last hop");
  check(
    (describeChain(chain, "/a") ?? "").includes("/d"),
    "chain message names the final destination",
  );

  // --- incoming rules become chains when a new rule is added ---
  const incoming = checkChain(
    { fromPath: "/b", toPath: "/c", statusCode: 301, matchType: "exact" },
    [r("1", "/a", "/b")],
  );
  equal(incoming.incoming.length, 1, "existing rule pointing at the new source is reported");
  check(!incoming.loop, "an incoming rule is not a loop");

  // --- terminal cases ---
  const offsite = checkChain(
    { fromPath: "/a", toPath: "https://example.com/x", statusCode: 301, matchType: "exact" },
    [r("1", "/b", "/a")],
  );
  check(!offsite.loop, "an off-site destination cannot chain");
  equal(offsite.chain.length, 0, "off-site destination is final");

  const gone = checkChain({ fromPath: "/a", toPath: null, statusCode: 410, matchType: "exact" }, [
    r("1", "/a2", "/a"),
  ]);
  check(!gone.loop, "410 is never a loop");
  equal(gone.finalDestination, null, "410 has no destination");

  // Excluding the rule being edited keeps an unchanged save from looking like a loop.
  const editing = checkChain(
    { id: "1", fromPath: "/a", toPath: "/b", statusCode: 301, matchType: "exact" },
    [r("1", "/a", "/b"), r("2", "/b", "/c")],
  );
  check(!editing.loop, "editing a rule excludes it from the graph");
  equal(editing.finalDestination, "/c", "chain still resolved while editing");

  // A wildcard rule's destination is a template, so it is treated as final.
  const wildcard = checkChain(
    { fromPath: "/old/*", toPath: "/new/$1", statusCode: 301, matchType: "wildcard" },
    [r("1", "/new/$1", "/other")],
  );
  check(!wildcard.loop, "wildcard destinations are not followed");
  equal(wildcard.chain.length, 0, "wildcard rules report no chain");
}
