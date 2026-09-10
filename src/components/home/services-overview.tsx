import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SERVICES_OVERVIEW } from "@/content/home";
import type { Service, ServiceLead } from "@/lib/data";
import { QuestionHeading } from "./question-heading";

const BADGE_VARIANT: Record<ServiceLead, "gold" | "secondary" | "outline"> = {
  integrated: "gold",
  astrology: "secondary",
  vastu: "outline",
};

/** Every active service, each stating whether it is astrology-led, vastu-led or integrated. */
export function ServicesOverview({ services }: { services: Service[] }) {
  return (
    <Section id={SERVICES_OVERVIEW.id} spacing="md" tone="muted" bordered>
      <Container size="wide" className="space-y-8">
        <QuestionHeading block={SERVICES_OVERVIEW} />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.slug} className="flex">
              <Card className="w-full gap-4 py-5">
                <CardHeader className="gap-3 px-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={BADGE_VARIANT[service.lead]}>
                      {SERVICES_OVERVIEW.leadLabel[service.lead]}
                    </Badge>
                    <span>{service.durationMinutes} min</span>
                  </div>
                  <CardTitle className="font-serif text-xl leading-snug font-medium">
                    <Link
                      href={`/services/${service.slug}`}
                      className="hover:text-accent-strong hover:underline"
                    >
                      {service.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 text-sm leading-relaxed text-muted-foreground">
                  {service.shortDescription}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <Button asChild variant="link" className="px-0">
          <Link href={SERVICES_OVERVIEW.allLink.href}>{SERVICES_OVERVIEW.allLink.label} →</Link>
        </Button>
      </Container>
    </Section>
  );
}
