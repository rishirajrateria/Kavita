import Link from "next/link";
import { Heading } from "@/components/ui/heading";
import type { GlossaryTerm } from "@/content/glossary";

/**
 * Ruled definition list of glossary terms — every `short` definition in the HTML, so the index
 * page itself answers "what is a dasha" without a click. Each term links to its own page.
 */
export function GlossaryList({ terms, id }: { terms: GlossaryTerm[]; id?: string }) {
  if (terms.length === 0) return null;
  return (
    <dl id={id} className="divide-y divide-accent-border/40 border-y border-accent-border/40">
      {terms.map((t) => (
        <div key={t.slug} className="grid gap-2 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
          <dt>
            <Heading as="span" level={4} className="text-xl">
              <Link
                href={`/glossary/${t.slug}`}
                className="hover:text-accent-strong hover:underline hover:decoration-accent-border hover:underline-offset-4"
              >
                {t.term}
              </Link>
            </Heading>
            {t.sanskrit ? (
              <span className="block text-sm text-muted-foreground italic">{t.sanskrit}</span>
            ) : null}
          </dt>
          <dd className="max-w-prose text-base leading-relaxed">{t.short}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Compact inline list of term links (related terms, "terms used in this article"). */
export function TermChips({ terms, label }: { terms: GlossaryTerm[]; label: string }) {
  if (terms.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/glossary/${t.slug}`}
              className="inline-flex min-h-9 items-center rounded-full border border-accent-border/60 px-3.5 font-serif text-base text-foreground transition-colors hover:border-accent-strong hover:text-accent-strong"
            >
              {t.term}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
