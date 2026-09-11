import { describedBy, Field } from "@/components/forms/field";
import { Textarea } from "@/components/ui/textarea";
import { BOOK_QUESTION_STEP } from "@/content/pages/book";

const MAX = 4000;

export interface StepQuestionProps {
  value: string;
  errors?: string[];
  onChange: (text: string) => void;
}

/** Step 5: one free-text box, optional, with a quiet counter. */
export function StepQuestion({ value, errors, onChange }: StepQuestionProps) {
  return (
    <div className="max-w-[44rem]">
      <Field
        id="question"
        label={BOOK_QUESTION_STEP.label}
        hint={BOOK_QUESTION_STEP.hint}
        errors={errors}
      >
        <Textarea
          id="question"
          name="question"
          rows={7}
          maxLength={MAX}
          value={value}
          placeholder={BOOK_QUESTION_STEP.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={errors ? true : undefined}
          aria-describedby={describedBy("question", BOOK_QUESTION_STEP.hint, errors)}
          className="min-h-44 text-base"
        />
      </Field>
      <p className="mt-2 text-right text-xs text-muted-foreground tabular-nums" aria-hidden="true">
        {BOOK_QUESTION_STEP.counter(value.length, MAX)}
      </p>
    </div>
  );
}
