import type * as React from "react";
import { TestimonialCard, type TestimonialCardProps } from "@/components/testimonials/card";
import { cn } from "@/lib/utils";

export interface TabletsProps {
  /** Real testimonial rows only — never a stand-in that is not marked `isPlaceholder`. */
  items: TestimonialCardProps[];
  /** One still tablet carrying the "none" / "empty" copy when there are no rows. */
  single?: { title: string; body: React.ReactNode };
  className?: string;
}

const LEVITATING = 6;

/**
 * Client experiences as levitating glass tablets (SPEC §2.3): each keeps today's
 * `TestimonialCard` markup verbatim (quote, name, place, service, `<time>`, consent badge,
 * `data-placeholder`). Only the first six levitate, phased three seconds apart; below `md`
 * they rest still and without sheen.
 */
export function Tablets({ items, single, className }: TabletsProps) {
  if (items.length === 0) {
    if (!single) return null;
    return (
      <div className={cn("tablet glass sheen max-w-[32rem] p-7 sm:p-9", className)}>
        <p className="font-serif text-xl leading-snug">{single.title}</p>
        <div className="mt-3 text-base text-muted-foreground">{single.body}</div>
      </div>
    );
  }

  return (
    <ul className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, i) => (
        <li
          key={item.testimonial.id}
          className="tablet glass sheen"
          data-levitate={i < LEVITATING ? "" : undefined}
          style={
            {
              animationDelay: `${-i * 3}s`,
              "--sheen-delay": `${i * 4}s`,
            } as React.CSSProperties
          }
        >
          <TestimonialCard {...item} />
        </li>
      ))}
    </ul>
  );
}
