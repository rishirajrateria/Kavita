import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPARISON } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/**
 * Astrology vs vastu specification table — the kind of block answer engines extract (§9.4).
 *
 * Ruled, not boxed: a gold hairline across the top, a hairline under the header and between
 * rows, and nothing else. No outer border, no shadow, no zebra fill. A specification table is
 * already a grid; wrapping it in a panel only adds a second one.
 */
export function Comparison() {
  const [corner, astrology, vastu] = COMPARISON.columns;

  return (
    <Section id={COMPARISON.id} spacing="lg">
      <Container size="wide" className="space-y-14">
        <QuestionHeading block={COMPARISON} route="/" id={COMPARISON.id} layout="split" />

        <Table containerClassName="border-t border-accent-border" className="text-base">
          <TableHeader>
            <TableRow className="border-b border-accent-border/40 hover:bg-transparent">
              <TableHead scope="col" className="h-auto w-[20%] px-0 py-6 whitespace-normal">
                <span className="sr-only">{corner || "Aspect"}</span>
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-5 py-6 font-serif text-2xl font-medium tracking-tight whitespace-normal text-accent-strong normal-case"
              >
                {astrology}
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-5 py-6 font-serif text-2xl font-medium tracking-tight whitespace-normal text-accent-strong normal-case"
              >
                {vastu}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON.rows.map(([aspect, a, v]) => (
              <TableRow
                key={aspect}
                className="border-b border-border/60 last:border-b-0 hover:bg-transparent"
              >
                <th
                  scope="row"
                  className="px-0 py-7 pr-5 text-left align-top font-sans text-xs font-semibold tracking-[0.12em] text-accent-strong uppercase"
                >
                  {aspect}
                </th>
                <TableCell className="min-w-[16rem] px-5 py-7 align-top leading-relaxed whitespace-normal text-muted-foreground">
                  {a}
                </TableCell>
                <TableCell className="min-w-[16rem] px-5 py-7 align-top leading-relaxed whitespace-normal text-muted-foreground">
                  {v}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* The note sits outside the scroll container: inside it, a <caption> takes the
            table's full scroll width and is clipped off-screen on a phone. */}
        <p className="-mt-8 text-sm text-muted-foreground">{COMPARISON.caption}</p>
      </Container>
    </Section>
  );
}
