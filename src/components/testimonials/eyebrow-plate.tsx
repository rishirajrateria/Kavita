import type * as React from "react";
import { Rule } from "@/components/content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

/**
 * A no-figure `FigureSection` does not render its `line`, so the plate's existing eyebrow
 * would drop out of the page. This band sets that eyebrow as the muted ruled caption on the
 * same 40 rem column, directly above the plate, and carries the plate's tone so caption and
 * plate read as one pane. Pass the `FigureSection` as the child with `tone="default"` and a
 * reduced top padding (`className="pt-6!"`); its `id` stays the anchor on its `<section>`.
 */
export function EyebrowPlate({
  eyebrow,
  tone = "default",
  children,
}: {
  eyebrow: string;
  tone?: "default" | "muted";
  children: React.ReactNode;
}) {
  return (
    <Section as="div" spacing="none" tone={tone}>
      <Container size="wide">
        <div className="mx-auto max-w-[40rem] pt-section-lg">
          <Rule tone="muted">{eyebrow}</Rule>
        </div>
      </Container>
      {children}
    </Section>
  );
}
