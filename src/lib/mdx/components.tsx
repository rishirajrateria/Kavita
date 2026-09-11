import Link from "next/link";
import * as React from "react";
import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import { Callout as UiCallout } from "@/components/ui/callout";
import { cn } from "@/lib/utils";

/**
 * Components exported to MDX article bodies (CLAUDE.md §9). Everything renders plain server HTML:
 * no client JavaScript, so the full text is in the document for crawlers and answer engines.
 */

/** MDX wraps block content in a paragraph; unwrap it so `<Answer>` never nests `<p>` in `<p>`. */
function unwrapParagraph(children: React.ReactNode): React.ReactNode {
  const items = React.Children.toArray(children);
  if (items.length === 1) {
    const only = items[0];
    if (React.isValidElement<{ children?: React.ReactNode }>(only) && only.type === "p") {
      return only.props.children;
    }
  }
  return children;
}

/**
 * The 40–60 word self-contained answer placed directly under every question H2 (§9.2).
 * Renders `<p class="answer">` — the selector the FAQPage `speakable` specification targets.
 */
export function Answer({ children }: { children: React.ReactNode }) {
  return <p className="answer">{unwrapParagraph(children)}</p>;
}

export function Callout({
  title,
  variant = "info",
  children,
}: {
  title?: string;
  variant?: "info" | "warn" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <UiCallout title={title} variant={variant} className="not-prose my-2">
      <div className="[&>p+p]:mt-2">{children}</div>
    </UiCallout>
  );
}

/** Inline link to a glossary entry: `<Term slug="dasha">dasha</Term>` → `/glossary/dasha`. */
export function Term({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/glossary/${slug}`}
      data-term={slug}
      className="text-foreground underline decoration-accent-border decoration-dotted underline-offset-[3px] hover:decoration-accent-strong"
    >
      {children}
    </Link>
  );
}

export type FigureChartKind = "north-chart" | "south-chart" | "compass" | "lines";

/** A line-art motif as a figure with a caption — the only "image" the articles use. */
export function FigureChart({
  kind = "north-chart",
  caption,
  title,
}: {
  kind?: FigureChartKind;
  caption?: string;
  /** Accessible name of the graphic. */
  title?: string;
}) {
  const motif =
    kind === "compass" ? (
      <VastuCompass title={title} strokeWidth={0.9} />
    ) : kind === "south-chart" ? (
      <SouthIndianChart title={title} strokeWidth={0.9} />
    ) : kind === "lines" ? (
      <AstronomicalLines title={title} strokeWidth={0.9} className="w-full" />
    ) : (
      <NorthIndianChart title={title} strokeWidth={0.9} />
    );
  return (
    <figure className="my-2 rounded-lg border border-accent-border/40 bg-surface-muted p-6 sm:p-8">
      <div className={cn("mx-auto text-accent-strong", kind === "lines" ? "max-w-xl" : "max-w-56")}>
        {motif}
      </div>
      {caption ? (
        <figcaption className="mt-4 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Markdown tables get the same scroll container as the UI kit's `<Table>`. */
function MdxTable(props: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table {...props} />
    </div>
  );
}

function MdxTableHead(props: React.ComponentProps<"th">) {
  return <th {...props} className={cn("bg-surface-muted", props.className)} />;
}

/** Internal links go through `next/link`; external ones open safely. */
function MdxAnchor({ href = "", children, ...rest }: React.ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} rel="noopener" {...rest}>
      {children}
    </a>
  );
}

/** Headings become hover-reveal anchor groups; `rehype-slug` supplies the ids. */
function heading(Tag: "h2" | "h3" | "h4") {
  return function MdxHeading({ className, ...props }: React.ComponentProps<"h2">) {
    return (
      <Tag {...props} className={cn("group scroll-mt-28 font-serif font-medium", className)} />
    );
  };
}

/** The component map handed to `compileMDX`. */
export const MDX_COMPONENTS = {
  Answer,
  Callout,
  Term,
  FigureChart,
  Table: MdxTable,
  table: MdxTable,
  th: MdxTableHead,
  a: MdxAnchor,
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
};
