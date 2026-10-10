import Link from "next/link";
import { Disc, SouthIndianChart, VastuCompass } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getAnswerOverridesForRoute, pickAnswer } from "@/lib/seo/aeo-data";
import { cn } from "@/lib/utils";
import { Rule } from "./rule";

export interface CtaDiscProps {
  id?: string;
  /** Canonical route; with `asAnswer`, an admin override for `(route, id)` replaces `body`. */
  route?: string;
  eyebrow?: string;
  /** The H2 — phrased as a question where possible. */
  title: string;
  /** One short paragraph; when it is a 40–60 word self-contained answer, pass `asAnswer`. */
  body: string;
  asAnswer?: boolean;
  primaryHref: string;
  /** Two or three short words — they sit on the parchment disc. */
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  motif?: "compass" | "south-chart";
  className?: string;
}

/**
 * The closing call to action of every page (SPEC §2.3): the parchment disc of the hub, lifted,
 * on the deepest night. It follows the `Foot` and, with the footer, is the page's one deep band. The
 * H2 is real; the primary link is an HTML `<a>` inside the disc; the secondary action is a
 * ruled ghost link. The backdrop motif is anchored to the disc alone — faded out
 * behind the H2 and body above and behind the ghost link beneath (no text over a figure) — so
 * the disc sits inside its hairlines and nothing else does.
 */
export async function CtaDisc({
  id = "book",
  route,
  eyebrow = "Next step",
  title,
  body: ownBody,
  asAnswer = false,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  motif = "south-chart",
  className,
}: CtaDiscProps) {
  const overrides = route && asAnswer ? await getAnswerOverridesForRoute(route) : {};
  const body = asAnswer ? pickAnswer(overrides, id, ownBody) : ownBody;
  const external = secondaryHref ? /^(https?:|mailto:|tel:)/.test(secondaryHref) : false;
  const secondary =
    secondaryHref && secondaryLabel ? (
      <>
        {secondaryLabel}
        <span aria-hidden="true" data-arrow className="inline-block">
          →
        </span>
      </>
    ) : null;
  const ghost =
    "inline-flex min-h-11 items-center gap-2 border-b border-accent-border/50 pb-0.5 font-serif text-[1.05rem] text-foreground no-underline transition-colors duration-(--duration-base) hover:border-accent-strong hover:text-accent-strong [&_[data-arrow]]:transition-transform [&_[data-arrow]]:duration-(--duration-base) [&_[data-arrow]]:ease-emphasized hover:[&_[data-arrow]]:translate-x-1";

  return (
    <Section
      id={id}
      spacing="none"
      tone="inverse"
      depth="deep"
      className={cn(
        "grain scroll-mt-20 overflow-hidden py-section-lg pb-24 sm:pb-section-lg",
        className,
      )}
    >
      <Container size="narrow" className="relative flex flex-col items-center text-center">
        <Rule tone="accent" className="justify-center">
          {eyebrow}
        </Rule>
        <h2 className="mx-auto mt-5 max-w-[22ch] font-serif text-[clamp(1.6rem,1.2rem+1.6vw,2.3rem)] leading-[1.1] font-normal tracking-normal text-foreground">
          {title}
        </h2>
        {asAnswer ? (
          <p className="answer mx-auto mt-5 max-w-[36rem] border-s-0 ps-0 text-center font-serif text-[1.15rem] leading-[1.55]">
            {body}
          </p>
        ) : (
          <p className="mx-auto mt-5 max-w-[56ch] text-center font-serif text-[1.15rem] leading-[1.55] text-muted-foreground">
            {body}
          </p>
        )}
        {/* The backdrop instrument is anchored to the disc and fades out within its own circle,
            so it never runs under the question, the body or the secondary link. */}
        <div className="relative isolate mt-12 grid place-items-center">
          <div
            aria-hidden="true"
            data-breathe
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[22rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(circle_closest-side,black_40%,transparent_62%)] text-accent-strong/14 sm:w-[26rem]"
          >
            {motif === "compass" ? (
              <VastuCompass decorative hideLabels description="" strokeWidth={0.6} />
            ) : (
              <SouthIndianChart decorative strokeWidth={0.6} />
            )}
          </div>
          <Disc
            href={primaryHref}
            label={primaryLabel}
            size="lg"
            className="max-w-[9rem] sm:max-w-none"
          />
        </div>
        {secondary ? (
          <p className="mt-14">
            {external ? (
              <a href={secondaryHref} rel="noopener" className={ghost}>
                {secondary}
              </a>
            ) : (
              <Link href={secondaryHref ?? "#"} className={ghost}>
                {secondary}
              </Link>
            )}
          </p>
        ) : null}
      </Container>
    </Section>
  );
}
