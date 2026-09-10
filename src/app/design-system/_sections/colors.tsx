import { Heading } from "@/components/ui/heading";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const RAMPS = [
  { name: "ivory", label: "Ivory / parchment neutrals" },
  { name: "indigo", label: "Midnight indigo" },
  { name: "gold", label: "Antique gold accent" },
] as const;

const SEMANTIC: ReadonlyArray<{ token: string; fg: string; note: string }> = [
  { token: "--background", fg: "--foreground", note: "Page ground / body text" },
  { token: "--card", fg: "--card-foreground", note: "Cards and raised panels" },
  { token: "--primary", fg: "--primary-foreground", note: "Primary action" },
  { token: "--secondary", fg: "--secondary-foreground", note: "Secondary action" },
  { token: "--muted", fg: "--muted-foreground", note: "Quiet surfaces, secondary text" },
  { token: "--accent", fg: "--accent-foreground", note: "Gold tint hover / highlight" },
  { token: "--surface-gold", fg: "--accent-strong", note: "Gold-tinted section" },
  { token: "--surface-inverse", fg: "--surface-inverse-foreground", note: "Inverse section" },
  { token: "--destructive", fg: "--destructive-foreground", note: "Destructive action" },
  { token: "--success-soft", fg: "--success", note: "Success notice" },
  { token: "--warning-soft", fg: "--warning", note: "Warning notice" },
  { token: "--error-soft", fg: "--error", note: "Error notice" },
  { token: "--info-soft", fg: "--info", note: "Info notice" },
];

function Swatch({ variable, label }: { variable: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-12 w-full rounded-md border border-border/60"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <code className="text-xs text-muted-foreground">{label}</code>
    </div>
  );
}

export function ColorsSection() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Heading as="h2" level={2} id="colours">
          Colour
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Three primitive ramps and a semantic layer on top. Components only use semantic tokens;
          the ramps exist so the semantic layer can be tuned without touching components. All
          body-text pairs meet WCAG 2.2 AA (see the ratio table in
          <code> src/styles/tokens.css</code>).
        </p>
      </div>

      {RAMPS.map((ramp) => (
        <div key={ramp.name} className="space-y-3">
          <Heading as="h3" level={5}>
            {ramp.label}
          </Heading>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
            {STEPS.map((step) => (
              <Swatch
                key={step}
                variable={`--${ramp.name}-${step}`}
                label={`${ramp.name}-${step}`}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <Heading as="h3" level={5}>
          Semantic pairs
        </Heading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEMANTIC.map((pair) => (
            <div
              key={pair.token}
              className="rounded-lg border p-4"
              style={{ backgroundColor: `var(${pair.token})`, color: `var(${pair.fg})` }}
            >
              <p className="font-serif text-lg">Aa — {pair.note}</p>
              <p className="mt-2 font-mono text-xs opacity-90">
                bg {pair.token}
                <br />
                fg {pair.fg}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
