import Link from "next/link";
import { QuestionHeading } from "@/components/home/question-heading";
import { cardVariants } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import { CHILD_CARD_CAP } from "@/lib/geo/linking";
import { cn } from "@/lib/utils";
import type { Question } from "./answers";

/**
 * Links DOWN the tree (CLAUDE.md §5): the location's publishable children as cards — the first
 * 24 — with any remainder in a compact inline list so no child is ever orphaned. Country pages
 * set this on the deep-indigo band; state pages on the muted pane, so the two tiers differ.
 *
 * Twenty-four tiles is the largest repeat on the site, so they take the `quiet` card: a
 * hairline and air, with the night showing through. Filled cards here would turn the page into
 * a wall of boxes — the lift on hover is what tells you they are objects.
 */
export function GeoChildrenGrid({
  children,
  href,
  question,
  route,
  tone,
}: {
  children: LocationRecord[];
  href: (loc: LocationRecord) => string;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  tone: "inverse" | "muted";
}) {
  if (children.length === 0) return null;
  const cards = children.slice(0, CHILD_CARD_CAP);
  const rest = children.slice(CHILD_CARD_CAP);

  return (
    <Section
      id="children"
      spacing="lg"
      tone={tone}
      className={tone === "inverse" ? "grain overflow-hidden" : undefined}
    >
      <Container size="wide" className="relative space-y-12">
        <QuestionHeading block={question} route={route} id="children" layout="split" />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((child) => (
            <li key={child.path} className="flex">
              <Link
                href={href(child)}
                // The card here IS the anchor, which Card's `as` union cannot express, so the
                // panel classes are applied directly rather than wrapping a link in a div.
                className={cn(
                  cardVariants({ variant: "quiet", padding: "sm", interactive: true }),
                  "group w-full gap-3 no-underline",
                )}
              >
                <span className="font-serif text-xl leading-snug transition-colors duration-(--duration-base) group-hover:text-accent-strong">
                  {child.name}
                </span>
                <span className="mt-auto flex items-center justify-between text-xs tracking-[0.1em] text-muted-foreground uppercase">
                  <span>{child.type === "state" ? "Region" : "City"}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover:translate-x-1 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {rest.length > 0 ? (
          <p className="max-w-prose border-t border-accent-border/30 pt-6 text-sm leading-loose text-muted-foreground">
            <span className="font-semibold text-foreground">Also: </span>
            {rest.map((child, i) => (
              <span key={child.path}>
                <Link
                  href={href(child)}
                  className="text-accent-strong underline decoration-accent-border/60 underline-offset-[3px] hover:decoration-accent-strong"
                >
                  {child.name}
                </Link>
                {i < rest.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        ) : null}
      </Container>
    </Section>
  );
}
