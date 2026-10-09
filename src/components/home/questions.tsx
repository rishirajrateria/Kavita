import Link from "next/link";
import { Foot, Ledger, More, StepLine, type FootBlock } from "@/components/content";
import {
  COMPARISON,
  FAQ_SECTION,
  HOW_IT_WORKS,
  METHOD,
  SERVICES_OVERVIEW,
  SERVING,
} from "@/content/home";

interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Notes to the plates — where the words live.
 *
 * The page above is pictures with a line under each. This is the quiet foot of the page that
 * keeps the site honest with search engines and AI answer engines: every question-form heading
 * as a real `<h2>` with its 40–60-word self-contained answer visible (CLAUDE.md §9.2), the
 * method's full prose and its worked example folded beneath, the comparison table in a ledger,
 * the four steps on a ruled line, then the route's FAQs as native `<details>`. All in the
 * served HTML; readable if you want it, ignorable if you don't, never a wall.
 */
function MethodNotes() {
  const { chart, vastu, combined } = METHOD;
  return (
    <More>
      <h3>{chart.heading}</h3>
      <p>{chart.intro}</p>
      <ul>
        {chart.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p>{chart.answers}</p>
      <h3>{vastu.heading}</h3>
      <p>{vastu.intro}</p>
      <ul>
        {vastu.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p>{vastu.answers}</p>
      <h3>{combined.heading}</h3>
      <p>{combined.intro}</p>
      <h4 className="font-display text-[0.68rem] font-semibold tracking-[0.22em] text-accent-strong uppercase">
        {combined.exampleHeading}
      </h4>
      {combined.example.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p>{combined.closing}</p>
    </More>
  );
}

const BLOCKS: readonly FootBlock[] = [
  { ...METHOD, children: <MethodNotes /> },
  {
    ...COMPARISON,
    children: (
      <Ledger
        table={{ caption: COMPARISON.caption, columns: COMPARISON.columns, rows: COMPARISON.rows }}
        stack
      />
    ),
  },
  {
    ...SERVICES_OVERVIEW,
    children: (
      <p className="text-sm">
        <Link href={SERVICES_OVERVIEW.allLink.href} className="text-accent-strong">
          {SERVICES_OVERVIEW.allLink.label} →
        </Link>
      </p>
    ),
  },
  { ...HOW_IT_WORKS, children: <StepLine steps={[...HOW_IT_WORKS.steps]} /> },
  SERVING,
];

export function Questions({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <Foot
      id={FAQ_SECTION.id}
      route="/"
      heading={FAQ_SECTION.heading}
      answer={FAQ_SECTION.answer}
      blocks={[...BLOCKS]}
      faqs={faqs.map(({ question, answer }) => ({ question, answer }))}
      allLink={FAQ_SECTION.allLink}
    />
  );
}
