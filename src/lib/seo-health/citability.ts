/**
 * Adapter from P6-A's citability scorer (`src/lib/seo/citability.ts`) to the crawler's
 * `scoreCitability` option: the crawler only needs the score and the fix list.
 */
import { scoreCitability } from "@/lib/seo/citability";
import type { CitabilityResult } from "./crawl";

export async function scorePageCitability(html: string): Promise<CitabilityResult | null> {
  const result = scoreCitability(html);
  return { score: result.score, fixes: result.fixes };
}
