/**
 * The citability checks as a readable list with the plain-language fixes (Phase 6 P6-A),
 * shared by the per-page SEO editor and the AEO panel.
 */
import type { CitabilityChecks, CitabilityResult } from "@/lib/seo/citability";

const LABELS: [keyof CitabilityChecks, string][] = [
  ["keyFacts", "Key facts block near the top"],
  ["questionH2s", "H2s phrased as questions"],
  ["answersUnderH2s", "A 40–60 word answer under each question"],
  ["table", "At least one comparison table"],
  ["dated", "Visible published / updated date"],
  ["byline", "Author byline linking to /about"],
  ["jsonLd", "JSON-LD structured data"],
];

export function CitabilityChecklist({ result }: { result: CitabilityResult }) {
  return (
    <>
      <ul className="space-y-1.5 text-sm">
        {LABELS.map(([key, label]) => {
          const ok = result.checks[key];
          return (
            <li key={key} className="flex items-start gap-2">
              <span aria-hidden="true" className={ok ? "text-success" : "text-error"}>
                {ok ? "✓" : "✗"}
              </span>
              <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
              <span className="sr-only">{ok ? "passes" : "fails"}</span>
            </li>
          );
        })}
      </ul>
      {result.fixes.length > 0 ? (
        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          {result.fixes.map((fix) => (
            <li key={fix} className="rounded-md border border-border/70 px-3 py-2">
              {fix}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-success">
          Everything an assistant looks for is on this page.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {result.detail.wordCount} words · {result.detail.questionH2Count} of {result.detail.h2Count}{" "}
        H2s are questions · {result.detail.tableCount} table
        {result.detail.tableCount === 1 ? "" : "s"}.
      </p>
    </>
  );
}
