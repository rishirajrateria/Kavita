/**
 * Answer-block linter (CLAUDE.md §9.2; Phase 6 P6-A). Pure and client-safe — the admin's live
 * counter island imports it — so it must never import the database.
 *
 * A self-contained answer makes sense quoted alone: 40–60 words, no leading pronoun pointing
 * at an earlier paragraph, no "as mentioned above" style references, and it names its subject
 * explicitly ("A vastu consultation for a Dubai apartment with Astrologer Kavita…", not "It
 * typically costs…"). §12 adds one honesty check: no outcome promises.
 */

export type AnswerIssueCode =
  | "too_short"
  | "too_long"
  | "leading_pronoun"
  | "undefined_reference"
  | "missing_subject"
  | "outcome_promise"
  | "empty";

export interface AnswerIssue {
  code: AnswerIssueCode;
  severity: "error" | "warning";
  message: string;
}

export interface AnswerLint {
  ok: boolean;
  wordCount: number;
  issues: AnswerIssue[];
}

export const ANSWER_MIN_WORDS = 40;
export const ANSWER_MAX_WORDS = 60;

/** Subjects an answer may name to count as self-contained when the caller gives none. */
export const DEFAULT_SUBJECTS = ["Astrologer Kavita", "Kavita"] as const;

const LEADING_PRONOUNS = /^(it|they|this|these|that|those|he|she|it's|they're|its)\b/i;
const UNDEFINED_REFERENCES: readonly [RegExp, string][] = [
  [/\b(as|like)\s+(mentioned|noted|described|explained|stated|discussed|shown)\b/i, "as mentioned"],
  [/\b(the\s+)?(above|below)\b/i, "above / below"],
  [/\bearlier\s+(in|on)\s+(this|the)\s+page\b/i, "earlier on this page"],
  [
    /\b(the\s+)?(following|previous|next)\s+(section|paragraph|point|table)\b/i,
    "the following section",
  ],
  [/\bsee\s+(the\s+)?(section|table|list)\b/i, "see the section"],
  [/\bthe\s+same\s+(one|thing|way)\b/i, "the same one"],
  [/\bhere\s+is\s+why\b/i, "here is why"],
];
const OUTCOME_PROMISES =
  /\b(guarantee[ds]?|100\s?%|cure[sd]?|will\s+(definitely|certainly|surely)|never\s+fails?|accurate\s+predictions?)\b/i;

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length === 1 && words[0] === "" ? 0 : words.length;
}

/** Lint one answer. `subjects` are names that make the answer self-contained when present. */
export function lintAnswer(
  answer: string,
  options: { subjects?: readonly string[] } = {},
): AnswerLint {
  const text = answer.replace(/\s+/g, " ").trim();
  const issues: AnswerIssue[] = [];
  const wordCount = countWords(text);

  if (wordCount === 0) {
    return {
      ok: false,
      wordCount,
      issues: [{ code: "empty", severity: "error", message: "The answer is empty." }],
    };
  }
  if (wordCount < ANSWER_MIN_WORDS) {
    issues.push({
      code: "too_short",
      severity: "error",
      message: `${wordCount} words — answers need ${ANSWER_MIN_WORDS}–${ANSWER_MAX_WORDS} to stand alone when quoted.`,
    });
  } else if (wordCount > ANSWER_MAX_WORDS) {
    issues.push({
      code: "too_long",
      severity: "error",
      message: `${wordCount} words — trim to ${ANSWER_MAX_WORDS} or fewer so an assistant can lift it whole.`,
    });
  }
  const pronoun = LEADING_PRONOUNS.exec(text);
  if (pronoun) {
    issues.push({
      code: "leading_pronoun",
      severity: "error",
      message: `Starts with "${pronoun[0]}" — a pronoun pointing at an earlier paragraph. Name the subject instead.`,
    });
  }
  for (const [re, label] of UNDEFINED_REFERENCES) {
    if (re.test(text)) {
      issues.push({
        code: "undefined_reference",
        severity: "warning",
        message: `Refers to something outside the answer ("${label}"); it must make sense quoted alone.`,
      });
      break;
    }
  }
  const subjects = options.subjects?.length ? options.subjects : DEFAULT_SUBJECTS;
  const lower = text.toLowerCase();
  if (!subjects.some((s) => s && lower.includes(s.toLowerCase()))) {
    issues.push({
      code: "missing_subject",
      severity: "warning",
      message: `Does not name the subject (${subjects.slice(0, 2).join(" / ")}). Say who and what explicitly.`,
    });
  }
  const promise = OUTCOME_PROMISES.exec(text);
  if (promise) {
    issues.push({
      code: "outcome_promise",
      severity: "error",
      message: `"${promise[0]}" promises an outcome — not allowed (CLAUDE.md §12). Describe the practice, not results.`,
    });
  }
  return { ok: !issues.some((i) => i.severity === "error"), wordCount, issues };
}

/** A question H2 is one a person would type or say: it ends with a question mark. */
export function isQuestionHeading(text: string): boolean {
  return /\?\s*$/.test(text.trim());
}
