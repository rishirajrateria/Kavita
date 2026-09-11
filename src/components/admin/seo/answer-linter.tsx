"use client";

/**
 * Textarea with the AEO linter running as you type (Phase 6 P6-A): live word count against
 * 40–60, leading-pronoun / undefined-reference / missing-subject / outcome-promise flags.
 * Posts as the plain `answer` field of the surrounding `ActionForm`.
 */
import { useId, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ANSWER_MAX_WORDS, ANSWER_MIN_WORDS, lintAnswer } from "@/lib/seo/aeo";
import { cn } from "@/lib/utils";

export function AnswerLinter({
  name = "answer",
  defaultValue = "",
  subjects,
  rows = 6,
}: {
  name?: string;
  defaultValue?: string;
  /** Names that satisfy the "names its subject" check for this page. */
  subjects?: string[];
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();
  const lint = lintAnswer(value, { subjects });
  const inRange = lint.wordCount >= ANSWER_MIN_WORDS && lint.wordCount <= ANSWER_MAX_WORDS;

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={`${id}-count ${id}-issues`}
        placeholder="A vastu consultation for a Dubai apartment with Astrologer Kavita…"
      />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span
          id={`${id}-count`}
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 font-semibold tabular-nums",
            value.trim() === ""
              ? "bg-muted text-muted-foreground"
              : inRange
                ? "bg-success-soft text-success"
                : "bg-error-soft text-error",
          )}
        >
          {lint.wordCount} words · target {ANSWER_MIN_WORDS}–{ANSWER_MAX_WORDS}
        </span>
        {value.trim() && lint.issues.length === 0 ? (
          <span className="text-success">Self-contained: reads well quoted alone.</span>
        ) : null}
      </div>
      <ul id={`${id}-issues`} className="space-y-1 text-xs" aria-live="polite">
        {value.trim()
          ? lint.issues
              .filter((i) => i.code !== "too_short" || lint.wordCount > 0)
              .map((issue) => (
                <li
                  key={issue.code}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5",
                    issue.severity === "error"
                      ? "border-error/30 bg-error-soft text-error"
                      : "border-warning/30 bg-warning-soft text-warning",
                  )}
                >
                  {issue.message}
                </li>
              ))
          : null}
      </ul>
    </div>
  );
}
