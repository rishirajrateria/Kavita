import { Callout } from "@/components/ui/callout";
import { Heading } from "@/components/ui/heading";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LegalBlock } from "@/content/legal";
import { RichText } from "./rich-text";

const cell = "px-4 py-3 align-top leading-relaxed whitespace-normal";

/** One typed content block of a legal section, as plain server HTML inside `.prose`. */
export function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case "h3":
      return (
        <Heading as="h3" level={4} className="font-serif">
          {block.text}
        </Heading>
      );
    case "ul":
    case "ol": {
      const List = block.type === "ul" ? "ul" : "ol";
      return (
        <List>
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "dl":
      return (
        <dl className="!block divide-y divide-accent-border/40 border-y border-accent-border/40">
          {block.rows.map((row) => (
            <div key={row.term} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-strong uppercase sm:pt-1">
                {row.term}
              </dt>
              <dd className="leading-relaxed">
                <RichText text={row.detail} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <Table
          containerClassName="rounded-lg border border-accent-border/40 bg-background"
          className="text-sm [&_tbody_tr:nth-child(even)]:bg-surface-muted/60 [&_th[scope=row]]:min-w-[11rem]"
        >
          {block.caption ? <TableCaption>{block.caption}</TableCaption> : null}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {block.columns.map((column) => (
                <TableHead key={column} scope="col" className={cell}>
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
                    <th key={value} scope="row" className={`${cell} text-left font-medium`}>
                      <RichText text={value} />
                    </th>
                  ) : (
                    <TableCell key={`${index}-${value}`} className={cell}>
                      <RichText text={value} />
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    case "note":
      return (
        <Callout variant="info" className="not-prose">
          <RichText text={block.text} />
        </Callout>
      );
  }
}
