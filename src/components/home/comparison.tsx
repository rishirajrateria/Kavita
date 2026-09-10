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
    <Section id={COMPARISON.id} spacing="md">
      <Container size="wide" className="space-y-8">
        <QuestionHeading block={COMPARISON} />

        <Table className="text-base">
          <TableCaption className="text-left">{COMPARISON.caption}</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[22%] whitespace-normal">
                <span className="sr-only">{corner || "Aspect"}</span>
              </TableHead>
              <TableHead scope="col" className="font-serif text-lg whitespace-normal">
                {astrology}
              </TableHead>
              <TableHead scope="col" className="font-serif text-lg whitespace-normal">
                {vastu}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON.rows.map(([aspect, a, v]) => (
              <TableRow key={aspect} className="hover:bg-transparent">
                <th
                  scope="row"
                  className="p-2 py-4 text-left align-top text-sm font-semibold tracking-wide text-accent-strong uppercase"
                >
                  {aspect}
                </th>
                <TableCell className="py-4 align-top leading-relaxed whitespace-normal">
                  {a}
                </TableCell>
                <TableCell className="py-4 align-top leading-relaxed whitespace-normal">
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
