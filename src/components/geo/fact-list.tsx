import { cn } from "@/lib/utils";

/**
 * A ruled definition list of researched facts — Karla caps labels in brass, Cormorant values —
 * two columns from `sm`. Plain server HTML, always visible.
 */
export function FactList({
  facts,
  className,
}: {
  facts: readonly (readonly [string, string])[];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-10 sm:grid-cols-2", className)}>
      {facts.map(([label, value]) => (
        <div key={label} className="border-t border-accent-border/25 py-4">
          <dt className="font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
            {label}
          </dt>
          <dd className="mt-1.5 font-serif text-[1.1rem] leading-snug text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
