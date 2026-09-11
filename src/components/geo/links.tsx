import Link from "next/link";
import { QuestionHeading } from "@/components/home/question-heading";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import type { LinkGraph } from "@/lib/geo/linking";
import { GEO_SERVICE_META } from "@/lib/geo/service";
import type { Question } from "./answers";

/**
 * The link graph made visible (CLAUDE.md §5): UP to the parent, SIDEWAYS to 4–6 siblings,
 * ACROSS to the counterpart family. Every href comes from `getLinkGraph`, never typed here.
 */
export function GeoLinks({
  loc,
  service,
  graph,
  question,
  tone = "default",
}: {
  loc: LocationRecord;
  service: GeoService;
  graph: LinkGraph;
  question: Question;
  tone?: "default" | "muted";
}) {
  const siblingLabel = loc.type === "state" ? "Other regions" : "Nearby cities";
  const meta = GEO_SERVICE_META[service];

  return (
    <Section spacing="lg" tone={tone} bordered={tone === "muted"}>
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={question} layout="split" />

        <div className="grid gap-8 border-t border-accent-border/40 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {graph.siblings.length > 0 ? (
            <div>
              <Heading as="h3" level={5} className="text-accent-strong">
                {siblingLabel}
              </Heading>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {graph.siblings.map((s) => (
                  <li key={s.path}>
                    <Link
                      href={graph.href(s)}
                      className="flex min-h-11 items-center justify-between gap-4 py-2 no-underline hover:text-accent-strong"
                    >
                      <span className="font-medium">
                        {meta.label} in {s.name}
                      </span>
                      <span aria-hidden="true" className="text-accent-strong">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Heading as="h3" level={5} className="text-accent-strong">
              The other half of the method
            </Heading>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The same place, read from the {service === "astrologer" ? "home" : "chart"} side.
            </p>
            <Link
              href={graph.counterpart.href}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-serif text-xl text-foreground no-underline hover:text-accent-strong"
            >
              {graph.counterpart.label}
              <span aria-hidden="true" className="text-accent-strong">
                →
              </span>
            </Link>
          </div>

          {graph.parent ? (
            <div>
              <Heading as="h3" level={5} className="text-accent-strong">
                Up one level
              </Heading>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Every city and region of {graph.parent.name} on one page.
              </p>
              <Link
                href={graph.href(graph.parent)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 font-serif text-xl text-foreground no-underline hover:text-accent-strong"
              >
                {meta.label} in {graph.parent.name}
                <span aria-hidden="true" className="text-accent-strong">
                  →
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
