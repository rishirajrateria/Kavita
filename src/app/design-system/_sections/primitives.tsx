import { ArrowRightIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rating } from "@/components/ui/rating";
import { Section } from "@/components/ui/section";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const BUTTON_VARIANTS = [
  "primary",
  "gold",
  "ghost",
  "link",
  "outline",
  "secondary",
  "destructive",
] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

export function PrimitivesSection() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Heading as="h2" level={2} id="primitives">
          Primitives
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          shadcn/ui components re-skinned through the token layer, plus the layout primitives every
          page is built from.
        </p>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Button — variants and sizes
        </Heading>
        <div className="flex flex-wrap items-center gap-3">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {BUTTON_SIZES.map((s) => (
            <Button key={s} variant="gold" size={s}>
              size {s}
            </Button>
          ))}
          <Button variant="primary" size="icon" aria-label="Continue">
            <ArrowRightIcon />
          </Button>
          <Button variant="primary" disabled>
            disabled
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Badge
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Badge>default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="gold">gold</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="destructive">destructive</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Form fields
        </Heading>
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ds-name">Full name</Label>
            <Input id="ds-name" placeholder="Sample placeholder" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ds-invalid">Field with error</Label>
            <Input id="ds-invalid" aria-invalid defaultValue="Sample invalid value" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ds-notes">Notes</Label>
            <Textarea id="ds-notes" placeholder="Sample multi-line placeholder" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Card, Avatar, Separator
        </Heading>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Sample card title</CardTitle>
              <CardDescription>Sample description text, no real content.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">Sample name</p>
                <p className="text-muted-foreground">Sample role</p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="primary" size="sm">
                Primary
              </Button>
              <Button variant="gold" size="sm">
                Gold
              </Button>
            </CardFooter>
          </Card>
          <div className="space-y-4 rounded-lg border p-6">
            <p className="text-sm">Above the separator</p>
            <Separator />
            <p className="text-sm">Below the separator</p>
            <div className="flex h-6 items-center gap-3 text-sm">
              <span>left</span>
              <Separator orientation="vertical" />
              <span>right</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Callout
        </Heading>
        <div className="grid gap-3 md:grid-cols-2">
          <Callout variant="info" title="Info">
            Sample informational note.
          </Callout>
          <Callout variant="warn" title="Warning">
            Sample warning text.
          </Callout>
          <Callout variant="success" title="Success">
            Sample success confirmation.
          </Callout>
          <Callout variant="error" title="Error">
            Sample error message.
          </Callout>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Rating (display only)
        </Heading>
        <p className="max-w-prose text-sm text-muted-foreground">
          Renders exactly the value passed in. The values below are arbitrary sample numbers to show
          the half-star rendering — they are not ratings of anything.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Rating value={4} label="Sample: 4 of 5 stars" />
          <Rating value={3.5} size="lg" showValue label="Sample: 3.5 of 5 stars" />
          <Rating value={2} size="sm" label="Sample: 2 of 5 stars" />
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Section and Container
        </Heading>
        <div className="overflow-hidden rounded-lg border">
          <Section spacing="sm" tone="default">
            <Container size="narrow">
              <p className="text-sm">
                <code>Section tone=&quot;default&quot;</code> ·{" "}
                <code>Container size=&quot;narrow&quot;</code>
              </p>
            </Container>
          </Section>
          <Section spacing="sm" tone="muted" bordered>
            <Container size="prose">
              <p className="text-sm">
                <code>tone=&quot;muted&quot; bordered</code> · <code>size=&quot;prose&quot;</code>
              </p>
            </Container>
          </Section>
          <Section spacing="sm" tone="gold">
            <Container>
              <p className="text-sm">
                <code>tone=&quot;gold&quot;</code> · <code>size=&quot;default&quot;</code>
              </p>
            </Container>
          </Section>
          <Section spacing="sm" tone="inverse">
            <Container size="wide">
              <p className="text-sm">
                <code>tone=&quot;inverse&quot;</code> · <code>size=&quot;wide&quot;</code>{" "}
                <span className="text-muted-foreground">muted text remaps automatically</span>
              </p>
            </Container>
          </Section>
        </div>
      </div>
    </div>
  );
}
