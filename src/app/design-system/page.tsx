import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ColorsSection } from "./_sections/colors";
import { CompositesSection } from "./_sections/composites";
import { MotifsSection } from "./_sections/motifs";
import { PrimitivesSection } from "./_sections/primitives";
import { TypographySection } from "./_sections/typography";

export const metadata: Metadata = {
  title: "Design system — Astrologer Kavita",
  robots: { index: false, follow: false },
};

const NAV = [
  ["#colours", "Colour"],
  ["#typography", "Typography"],
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
      <Section spacing="sm" tone="muted" bordered>
        <Container size="wide" className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading as="h1" level={3} eyebrow="Internal reference">
              Design system
            </Heading>
            <p className="mt-1 text-sm text-muted-foreground">
              Tokens, primitives and motifs. Not indexed; hidden in production.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <nav aria-label="Design system sections" className="hidden gap-4 text-sm sm:flex">
              {NAV.map(([href, label]) => (
                <a key={href} href={href} className="text-accent-strong hover:underline">
                  {label}
                </a>
              ))}
            </nav>
            <ThemeToggle showLabel />
          </div>
        </Container>
      </Section>

      <Section spacing="md">
        <Container size="wide" className="space-y-20">
          <ColorsSection />
          <TypographySection />
          <PrimitivesSection />
          <CompositesSection />
          <MotifsSection />
        </Container>
      </Section>
    </main>
  );
}
