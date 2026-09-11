import Link from "next/link";
import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import { CHILD_CARD_CAP } from "@/lib/geo/linking";
import type { Question } from "./answers";

/**
 * Links DOWN the tree (CLAUDE.md §5): the location's publishable children as cards — the first
 * 24 — with any remainder in a compact inline list so no child is ever orphaned. Country pages
 * set this on the deep-indigo band; state pages on parchment, so the two tiers differ visually.
 */
export function GeoChildrenGrid({
  children,
  href,
  question,
  tone,
}: {
  children: LocationRecord[];
  href: (loc: LocationRecord) => string;
  question: Question;
  tone: "inverse" | "muted";
}) {
  if (children.length === 0) return null;
  const cards = children.slice(0, CHILD_CARD_CAP);
  const rest = children.slice(CHILD_CARD_CAP);

  return (
    <Section
      spacing="lg"
      tone={tone}
      bordered={tone === "muted"}
      className={tone === "inverse" ? "grain overflow-hidden" : undefined}
    >
      <Container size="wide" className="relative space-y-10">
        <QuestionHeading block={question} layout="split" />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((child) => (
            <li key={child.path} className="flex">
              <Link
                href={href(child)}
                className="group relative flex w-full flex-col gap-2 rounded-xl border border-accent-border/30 bg-card p-5 text-card-foreground no-underline shadow-xs transition-[box-shadow,translate,border-color] duration-(--duration-base) ease-standard before:absolute before:top-0 before:left-5 before:h-0.5 before:w-6 before:bg-accent-border before:transition-[width] before:duration-(--duration-slow) before:ease-emphasized hover:-translate-y-0.5 hover:border-accent-border/70 hover:shadow-md hover:before:w-[calc(100%-2.5rem)] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:hover:translate-y-0"
              >
                <span className="font-serif text-xl leading-snug group-hover:text-accent-strong">
                  {child.name}
                </span>
                <span className="flex items-center justify-between text-xs tracking-[0.1em] text-muted-foreground uppercase">
                  <span>{child.type === "state" ? "Region" : "City"}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block text-accent-strong transition-transform duration-(--duration-base) ease-emphasized group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {rest.length > 0 ? (
          <p className="text-sm leading-loose text-muted-foreground">
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
