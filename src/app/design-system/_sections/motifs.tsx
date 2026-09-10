import {
  AstronomicalLines,
  NorthIndianChart,
  SouthIndianChart,
  VastuCompass,
} from "@/components/motifs";
import { Heading } from "@/components/ui/heading";

const MOTIFS = [
  { name: "NorthIndianChart", Comp: NorthIndianChart },
  { name: "SouthIndianChart", Comp: SouthIndianChart },
  { name: "VastuCompass", Comp: VastuCompass },
] as const;

export function MotifsSection() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Heading as="h2" level={2} id="motifs">
          Motifs
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Inline SVG line-art in <code>currentColor</code>, 1–1.25 stroke. Labelled with a{" "}
          <code>&lt;title&gt;</code> by default; pass <code>decorative</code> when used purely as
          ornament so screen readers skip them.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {MOTIFS.map(({ name, Comp }) => (
          <figure key={name} className="space-y-3 rounded-lg border p-6">
            <div className="mx-auto max-w-48 text-accent-strong">
              <Comp />
            </div>
            <figcaption className="text-center">
              <code className="text-xs">{`<${name} />`}</code>
            </figcaption>
          </figure>
        ))}
      </div>

      <figure className="space-y-3 rounded-lg border bg-surface-gold p-6">
        <div className="text-indigo-700 dark:text-gold-300">
          <AstronomicalLines decorative />
        </div>
        <figcaption className="text-center">
          <code className="text-xs">{"<AstronomicalLines decorative />"}</code>
        </figcaption>
      </figure>
    </div>
  );
}
