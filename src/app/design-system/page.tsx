import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorsSection } from "./_sections/colors";
import { CompositesSection } from "./_sections/composites";
import { FoundationSection } from "./_sections/foundation";
import { MotifsSection } from "./_sections/motifs";
import { MotionSection } from "./_sections/motion";
import { PrimitivesSection } from "./_sections/primitives";
import { TypographySection } from "./_sections/typography";

export const metadata: Metadata = {
  title: "Design system — Astrologer Kavita",
  robots: { index: false, follow: false },
};

const NAV = [
  ["#foundation", "Foundation"],
  ["#colours", "Colour"],
  ["#typography", "Typography"],
  ["#motion", "Motion"],
  ["#primitives", "Primitives"],
  ["#composites", "Composites"],
  ["#motifs", "Motifs"],
] as const;

/** Dev-only reference page. Hidden in production unless SHOW_DESIGN_SYSTEM=true. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DESIGN_SYSTEM !== "true") {
    notFound();
  }

  return (
    <main id="main" className="flex-1">
      <Section spacing="sm">
        <Container size="wide">
          <div className="glass flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:p-6">
            <div>
              <Heading as="h1" level={3} eyebrow="Internal reference">
                Midnight Observatory
              </Heading>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                The living documentation of the design system: tokens, surfaces, motion, primitives
                and motifs. Not indexed; hidden in production. If a page disagrees with this one,
                this one is wrong — fix it here in the same change.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <nav aria-label="Design system sections" className="hidden gap-4 text-sm lg:flex">
                {NAV.map(([href, label]) => (
                  <a key={href} href={href} className="text-accent-strong hover:underline">
                    {label}
                  </a>
                ))}
              </nav>
              <ThemeToggle showLabel />
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="md">
        <Container size="wide" className="space-y-24">
          <FoundationSection />
          <ColorsSection />
          <TypographySection />
          <MotionSection />
          <PrimitivesSection />
          <CompositesSection />
          <MotifsSection />
        </Container>
      </Section>
    </main>
  );
}
