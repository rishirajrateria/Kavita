import Link from "next/link";
import { DoorField, FigureSection } from "@/components/content";
import type { LocationRecord } from "@/content/locations/schema";
import type { GeoService } from "@/lib/data/types";
import { CHILD_CARD_CAP } from "@/lib/geo/linking";
import type { Question } from "./answers";
import { SERVICE_MOTIF, WIDE_BLOCK, type Plate } from "./parts";

/**
 * Links DOWN the tree (CLAUDE.md §5): the location's publishable children as doors — the first
 * 24 — with any remainder in a compact inline list so no child is ever orphaned. A place has no
 * true position on a chart or a compass, so the doors sit in a quiet grid (SPEC §1, rule 2),
 * each carrying the family's glyph and its tier (`Region` / `City`) as meta.
 */
export function GeoChildrenGrid({
  children,
  href,
  question,
  route,
  service,
  plate,
}: {
  children: LocationRecord[];
  href: (loc: LocationRecord) => string;
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` answer overrides. */
  route?: string;
  service: GeoService;
  plate: Plate;
}) {
  if (children.length === 0) return null;
  const doors = children.slice(0, CHILD_CARD_CAP);
  const rest = children.slice(CHILD_CARD_CAP);
  // Columns follow the count, so two or three doors never leave most of the block empty; a
  // short field also keeps to the answer's measure rather than the wide block's.
  const columns = doors.length >= 4 ? 4 : doors.length === 3 ? 3 : 2;

  return (
    <FigureSection
      id="children"
      route={route}
      n={plate.n}
      tone={plate.tone}
      question={question.question}
      answer={question.answer}
      className={WIDE_BLOCK}
    >
      <DoorField
        variant="tile"
        columns={columns}
        className={doors.length < 4 ? "max-w-[32rem]" : undefined}
        doors={doors.map((child) => ({
          href: href(child),
          label: child.name,
          meta: child.type === "state" ? "Region" : "City",
          motif: SERVICE_MOTIF[service],
        }))}
      />

      {rest.length > 0 ? (
        <p className="max-w-prose border-t border-accent-border/30 pt-6 font-sans text-sm leading-loose text-muted-foreground">
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
    </FigureSection>
  );
}
