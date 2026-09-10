import { Heading } from "@/components/ui/heading";
import type { QuestionBlock } from "@/content/home";

/**
 * A question-phrased H2 followed immediately by its 40–60 word self-contained answer in
 * `<p class="answer">` (CLAUDE.md §9.2). Server-rendered plain HTML; nothing hidden behind JS.
 */
export function QuestionHeading({
  block,
  answerClassName,
}: {
  block: Pick<QuestionBlock, "eyebrow" | "question" | "answer">;
  answerClassName?: string;
}) {
  return (
    <div className="space-y-5">
      <Heading as="h2" level={2} eyebrow={block.eyebrow}>
        {block.question}
      </Heading>
      <p className={answerClassName ? `answer ${answerClassName}` : "answer"}>{block.answer}</p>
    </div>
  );
}
