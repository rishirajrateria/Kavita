import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FINAL_CTA } from "@/content/home";

/** Closing call to action: book, or ask first. */
export function FinalCta() {
  return (
    <Section id={FINAL_CTA.id} spacing="lg" tone="gold" bordered>
      <Container size="narrow" className="space-y-6 text-center">
        <Heading as="h2" level={2} eyebrow={FINAL_CTA.eyebrow}>
          {FINAL_CTA.heading}
        </Heading>
        <p className="mx-auto max-w-prose text-lg leading-relaxed text-muted-foreground">
          {FINAL_CTA.body}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href={FINAL_CTA.primaryCta.href}>{FINAL_CTA.primaryCta.label}</Link>
          </Button>
          <Button asChild variant="gold" size="lg">
            <Link href={FINAL_CTA.secondaryCta.href}>{FINAL_CTA.secondaryCta.label}</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
