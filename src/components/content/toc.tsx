import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  /** Heading level; level-3 items are indented. Default 2. */
  level?: 2 | 3;
}

export interface TocProps {
  items: TocItem[];
  label?: string;
  /** Stick under the 64px site header while the page scrolls (default true). */
  sticky?: boolean;
  className?: string;
}

/**
 * "On this page" — a server-rendered list of in-page anchors, no JavaScript. Rendered as a
 * slim band that sticks below the site header; on phones it scrolls sideways in one line.
 */
export function Toc({ items, label = "On this page", sticky = true, className }: TocProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={label}
      data-slot="toc"
      className={cn(
        "z-30 border-b border-accent-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        sticky && "sticky top-16",
        className,
      )}
    >
      <Container size="wide" className="flex items-center gap-4 overflow-x-auto py-2.5">
        <span className="shrink-0 font-sans text-[0.65rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
          {label}
        </span>
        <ol className="flex items-center gap-1 text-sm whitespace-nowrap">
          {items.map((item) => (
            <li key={item.id} className={cn(item.level === 3 && "pl-2")}>
              <a
                href={`#${item.id}`}
                className="nav-link inline-flex min-h-9 items-center px-2 text-muted-foreground no-underline hover:text-foreground"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </Container>
    </nav>
  );
}
