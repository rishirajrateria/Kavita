import { Card } from "@/components/ui/card";
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
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Key-facts slab (CLAUDE.md §9.3): a compact `<dl>` on a frosted plate, ruled by gold
 * hairlines rather than divided into filled cells — identical to the home and geo slabs. This
 * is one of the two blocks a content page spends `.glass` on, because it is the block an answer
 * engine lifts almost verbatim. Every value is passed in by the page, or overridden per route
 * from `/admin/aeo`.
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

  return (
    <Section
      id={id}
      spacing="sm"
      className={cn("scroll-mt-20", className)}
      aria-labelledby={`${id}-heading`}
    >
      <Container size="wide">
        <Card variant="glass" padding="lg">
          <Heading
            as="h2"
            level={6}
            id={`${id}-heading`}
            className="flex items-center gap-4 font-sans text-xs font-semibold tracking-[0.16em] text-accent-strong uppercase after:h-px after:flex-1 after:bg-accent-border/40"
          >
            {heading}
          </Heading>
          <dl className={cn("mt-2 grid gap-x-10", COLS[columns])}>
            {items.map(({ label, value }) => (
              <div key={label} className="border-t border-accent-border/25 py-4 sm:py-5">
                <dt className="text-[0.65rem] font-semibold tracking-[0.12em] text-accent-strong uppercase">
                  {label}
                </dt>
                <dd className="mt-2 font-serif text-lg leading-snug text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          {note ? (
            <p className="border-t border-accent-border/25 pt-4 text-sm text-muted-foreground">
              {note}
            </p>
          ) : null}
        </Card>
      </Container>
    </Section>
  );
}
