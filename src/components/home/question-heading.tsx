import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";
import type { QuestionBlock } from "@/content/home";

/**
 * A question-phrased H2 followed immediately by its 40–60 word self-contained answer in
 * `<p class="answer">` (CLAUDE.md §9.2). Server-rendered plain HTML; nothing hidden behind JS.
 * `layout="split"` sets the question left and the answer right on wide screens for an
 * editorial feel; the DOM order (question, then answer) never changes.
 */
export function QuestionHeading({
  block,
  answerClassName,
  layout = "stack",
  className,
}: {
  block: Pick<QuestionBlock, "eyebrow" | "question" | "answer">;
  answerClassName?: string;
  layout?: "stack" | "split";
  className?: string;
}) {
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
      <p className={cn("answer", answerClassName)}>{block.answer}</p>
    </div>
  );
}
