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
 * The question is deliberately one step larger than a default h2 and set on a short measure:
 * this block is the masthead of every section on the site, and the minimalist direction asks
 * for fewer elements at a larger size rather than more elements at a smaller one.
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
          ? "grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:gap-16"
          : "space-y-6",
        className,
      )}
    >
      <Heading
        as="h2"
        level={2}
        eyebrow={block.eyebrow}
        className="max-w-[22ch] text-4xl leading-[1.08]"
      >
        {block.question}
      </Heading>
      <p className={cn("answer", answerClassName)}>{answer}</p>
    </div>
  );
}
