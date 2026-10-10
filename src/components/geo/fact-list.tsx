import { cn } from "@/lib/utils";

/** A value longer than this many words is prose, not a ledger entry. */
const LONG_VALUE_WORDS = 30;

function isLong(value: string): boolean {
  return value.trim().split(/\s+/).length > LONG_VALUE_WORDS;
}

/**
 * A ruled definition list of researched facts — Karla caps labels in brass, Cormorant values —
 * two columns from `sm`. A value of more than about thirty words spans both columns and is set
 * in the plate's prose voice (Karla, muted, 62ch), so the short facts stay a quiet two-column
 * ledger and the long note never becomes a narrow dense column beside a one-line value. Short
 * facts are listed first; the order within each group is kept. Plain server HTML, always visible.
 */
export function FactList({
  facts,
  className,
}: {
  facts: readonly (readonly [string, string])[];
  className?: string;
}) {
  const ordered = [
    ...facts.filter(([, value]) => !isLong(value)),
    ...facts.filter(([, value]) => isLong(value)),
  ];

  return (
    <dl className={cn("grid gap-x-10 sm:grid-cols-2", className)}>
      {ordered.map(([label, value]) => {
        const long = isLong(value);
        return (
          <div
            key={label}
            className={cn("border-t border-accent-border/25 py-4", long && "sm:col-span-2")}
          >
            <dt className="font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
              {label}
            </dt>
            <dd
              className={
                long
                  ? "mt-2 max-w-[62ch] font-sans text-base leading-[1.7] text-muted-foreground"
                  : "mt-1.5 font-serif text-[1.1rem] leading-snug text-foreground"
              }
            >
              {value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
