import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPARISON } from "@/content/home";
import { QuestionHeading } from "./question-heading";

/** Astrology vs vastu specification table — the kind of block answer engines extract (§9.4). */
export function Comparison() {
  const [corner, astrology, vastu] = COMPARISON.columns;

  return (
    <Section id={COMPARISON.id} spacing="lg">
      <Container size="wide" className="space-y-10">
        <QuestionHeading block={COMPARISON} layout="split" />

        <Table
          containerClassName="rounded-xl border border-t-2 border-t-accent-border shadow-sm"
          className="text-base"
        >
          <TableCaption className="px-4 pb-4 text-left">{COMPARISON.caption}</TableCaption>
          <TableHeader>
            <TableRow className="border-b-2 hover:bg-transparent">
              <TableHead scope="col" className="h-auto w-[22%] px-5 py-5 whitespace-normal">
                <span className="sr-only">{corner || "Aspect"}</span>
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-5 py-5 font-serif text-xl font-medium whitespace-normal text-foreground"
              >
                {astrology}
              </TableHead>
              <TableHead
                scope="col"
                className="h-auto px-5 py-5 font-serif text-xl font-medium whitespace-normal text-foreground"
              >
                {vastu}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON.rows.map(([aspect, a, v]) => (
              <TableRow key={aspect} className="even:bg-surface-muted/40 hover:bg-transparent">
                <th
                  scope="row"
                  className="px-5 py-5 text-left align-top text-sm font-medium text-foreground"
                >
                  {aspect}
                </th>
                <TableCell className="min-w-[16rem] px-5 py-5 align-top leading-relaxed whitespace-normal">
                  {a}
                </TableCell>
                <TableCell className="min-w-[16rem] px-5 py-5 align-top leading-relaxed whitespace-normal">
                  {v}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    </Section>
  );
}
