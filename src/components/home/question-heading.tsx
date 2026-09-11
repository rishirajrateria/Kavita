import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";
import type { QuestionBlock } from "@/content/home";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";

/**
 * A question-phrased H2 followed immediately by its 40–60 word self-contained answer in
 * `<p class="answer">` (CLAUDE.md §9.2). Server-rendered plain HTML; nothing hidden behind JS.
 * `layout="split"` sets the question left and the answer right on wide screens for an
 * editorial feel; the DOM order (question, then answer) never changes.
 *
 * When the page passes its canonical `route` and the block's `id` — the same `(route, h2_id)`
 * pair the owner types in `/admin/aeo` — an answer saved there replaces the written copy. The
 * lookup is one memoised read per route per request and short-circuits to `{}` with no
 * database, so the markup and the static build are unchanged either way.
 */
export async function QuestionHeading({
  block,
  route,
  id,
  answerClassName,
  layout = "stack",
  className,
}: {
  block: Pick<QuestionBlock, "eyebrow" | "question" | "answer">;
  /** Canonical route of the page, e.g. `/astrologer/india/maharashtra/mumbai`. */
  route?: string;
  /** The block's stable anchor id — the `h2_id` an override is keyed by. */
  id?: string;
  answerClassName?: string;
  layout?: "stack" | "split";
  className?: string;
}) {
  const overrides = route ? await getAnswerOverridesForRoute(route) : {};
  const answer = pickAnswer(overrides, id, block.answer);

  return (
    <div
      className={cn(
        "reveal",
        layout === "split"
          ? "grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-12"
          : "space-y-5",
        className,
      )}
    >
      <Heading as="h2" level={2} eyebrow={block.eyebrow} className="max-w-[26ch]">
        {block.question}
      </Heading>
      <p className={cn("answer", answerClassName)}>{answer}</p>
    </div>
  );
}
