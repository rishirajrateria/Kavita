import { Callout } from "@/components/ui/callout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LegalBlock } from "@/content/legal";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

/** Cinzel caption type for a term or a column head (SPEC §2.1, never below 0.62 rem). */
const CAPTION =
  "font-display text-[0.62rem] font-semibold tracking-[0.22em] text-accent-strong uppercase";

/**
 * One typed content block of a legal section, as plain server HTML inside `.prose`, set in the
 * engraved voice: terms in Cinzel capitals over Cormorant detail, lists on hairlines, a table as
 * type on a grid (hairline head and row rules, no box) that stacks its rows on a phone, and a
 * note as a quiet aside. Every block is visible at rest — legal text is never folded.
 */
export function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case "h3":
      return <h3 className="font-serif text-xl font-normal text-foreground">{block.text}</h3>;
    case "ul":
      return (
        <ul className="list-none! divide-y divide-accent-border/30 border-y border-accent-border/30 p-0!">
          {block.items.map((item) => (
            <li key={item} className="mt-0! py-3">
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal marker:font-serif marker:text-accent-strong">
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              <RichText text={item} />
            </li>
          ))}
        </ol>
      );
    case "dl":
      return (
        <dl className="block! divide-y divide-accent-border/30 border-y border-accent-border/30">
          {block.rows.map((row) => (
            <div key={row.term} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className={cn(CAPTION, "font-semibold sm:pt-1.5")}>{row.term}</dt>
              <dd className="font-serif text-[1.1rem] leading-[1.5] text-foreground">
                <RichText text={row.detail} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table": {
      const stack = block.columns.length > 2;
      return (
        <div>
          <Table className={cn("text-base", stack && "plate-stack")} aria-label={block.caption}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {block.columns.map((column) => (
                  <TableHead key={column} scope="col" className={cn(CAPTION, "pb-3")}>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row) => (
                <TableRow key={row.join("|")} className="hover:bg-transparent">
                  {row.map((value, index) =>
                    index === 0 ? (
                      <th
                        key={value}
                        scope="row"
                        className="min-w-[9rem] py-3.5 pr-6 pl-0 text-left align-top font-serif text-lg leading-snug font-normal [overflow-wrap:anywhere] text-foreground"
                      >
                        <RichText text={value} />
                      </th>
                    ) : (
                      <TableCell
                        key={`${index}-${value}`}
                        className={cn(
                          "py-3.5 align-top leading-relaxed [overflow-wrap:anywhere] whitespace-normal",
                          stack && "max-sm:last:border-b-0",
                        )}
                        data-label={block.columns[index] ?? ""}
                      >
                        <RichText text={value} />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Outside the scroll container, so a wide table never carries its caption off-screen. */}
          {block.caption ? (
            <p className="mt-4! font-sans text-sm text-muted-foreground">{block.caption}</p>
          ) : null}
        </div>
      );
    }
    case "note":
      return (
        <Callout variant="note" className="not-prose font-sans">
          <RichText text={block.text} />
        </Callout>
      );
  }
}
