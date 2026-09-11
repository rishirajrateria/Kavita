import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { getKeyFactsOverride, mergeKeyFacts } from "@/lib/seo/aeo-data";
import { cn } from "@/lib/utils";

export interface KeyFactItem {
  label: string;
  value: string;
}

export interface KeyFactsProps {
  /** Small-caps heading above the list, e.g. "Kundli analysis at a glance". */
  heading?: string;
  items: KeyFactItem[];
  /** Columns on large screens. */
  columns?: 2 | 3 | 4;
  /** Footnote under the list. */
  note?: string;
  id?: string;
  /**
   * Canonical route of the page. With it, key facts saved for this route in `/admin/aeo`
   * (`h2_id` = `key-facts`) are merged in: a matching label replaces the page's value, any
   * further fact is appended. One memoised read per route; `{}` with no database.
   */
  route?: string;
  className?: string;
}

const COLS: Record<NonNullable<KeyFactsProps["columns"]>, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Ruled key-facts band (CLAUDE.md §9.3): a compact `<dl>` on parchment with gold hairlines
 * between items, identical to the home and geo bands. Every value is passed in by the page,
 * or overridden per route from `/admin/aeo`.
 */
export async function KeyFacts({
  heading = "At a glance",
  items: ownItems,
  columns = 4,
  note,
  id = "key-facts",
  route,
  className,
}: KeyFactsProps) {
  const items = mergeKeyFacts(ownItems, route ? await getKeyFactsOverride(route) : []);
  if (items.length === 0) return null;
  const odd = items.length % 2 === 1;

  return (
    <Section
      id={id}
      spacing="none"
      tone="muted"
      className={cn("scroll-mt-20 border-y border-accent-border/40", className)}
      aria-labelledby={`${id}-heading`}
    >
      <Container size="wide" className="py-8 sm:py-10">
        <Heading
          as="h2"
          level={6}
          id={`${id}-heading`}
          className="mb-6 text-center font-sans text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase"
        >
          {heading}
        </Heading>
        <dl
          className={cn(
            "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-accent-border/30 bg-accent-border/30",
            COLS[columns],
            odd && "[&>div:last-child]:col-span-2 lg:[&>div:last-child]:col-span-1",
          )}
        >
          {items.map(({ label, value }) => (
            <div key={label} className="bg-surface-muted px-4 py-4 sm:px-5 sm:py-5">
              <dt className="text-[0.65rem] font-semibold tracking-[0.1em] text-accent-strong uppercase sm:text-[0.68rem] sm:tracking-[0.12em]">
                {label}
              </dt>
              <dd className="mt-1.5 font-serif text-[0.95rem] leading-snug text-foreground sm:text-lg">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {note ? <p className="mt-4 text-sm text-muted-foreground">{note}</p> : null}
      </Container>
    </Section>
  );
}
