import {
  AstronomicalLines,
  Instrument,
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
    <div className="space-y-12">
      <div className="space-y-3">
        <Heading as="h2" level={2} id="motifs">
          Motifs
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Inline SVG line-art in <code>currentColor</code>, 1–1.25 stroke. Labelled with a{" "}
          <code>&lt;title&gt;</code> by default; pass <code>decorative</code> when used purely as
          ornament so screen readers skip them. Every one accepts the motion attributes — the
          compass takes <code>data-turn</code>, ambient linework takes <code>data-breathe</code>.
        </p>
      </div>

      {/* ---------------------------------------------------------------- the Instrument */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="instrument">
          <code className="font-serif">&lt;Instrument /&gt;</code> — the centrepiece
        </Heading>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="glass mx-auto w-full max-w-[22rem] p-6">
            <Instrument />
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p className="max-w-prose">
              A North Indian kundli — a square with both diagonals and an inscribed diamond — laid
              directly over the vastu purusha mandala, inside a ring of twelve house ticks, with the
              brahmasthan left open at the centre. It is the site&apos;s thesis as one drawing: two
              instruments, one square.
            </p>
            <p className="max-w-prose">
              It is the hero graphic rather than a portrait because it is the one image no other
              practitioner could use — nobody else reads both together. A photograph states only
              that a person exists; it earns its place on <code>/about</code>, where a reader has
              asked who she is.
            </p>
            <p className="max-w-prose">
              Composed of three motion attributes at once: the ring turns (<code>data-turn</code>,
              240s), the mandala breathes (<code>data-breathe</code>), and the kundli&apos;s three
              strokes draw themselves in sequence (<code>data-draw</code> with staggered{" "}
              <code>--draw-delay</code>). All of it rests finished. Set <code>turnDuration</code> to
              slow the ring further.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- the Sky */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="sky">
          <code className="font-serif">&lt;Sky /&gt;</code> — mounted once, in the root layout
        </Heading>
        <div className="glass space-y-3 p-6 text-muted-foreground">
          <p className="max-w-prose">
            It is behind this panel right now. Two radial washes (<code>--sky-warm</code>,{" "}
            <code>--sky-cool</code>) over <code>--background</code>, plus eight star sizes painted
            as gradients on a single tiled layer that drifts for 150 seconds and back. Fixed,{" "}
            <code>pointer-events: none</code>, <code>-z-10</code>, zero DOM per star and no text —
            so it costs the server-rendered content nothing.
          </p>
          <p className="max-w-prose">
            Its real job is not decoration. <code>backdrop-filter</code> over a flat fill produces a
            tinted rectangle and nothing more; over a drifting starfield it produces depth. The Sky
            is what gives <code>.glass</code> something to refract, which is why the two are a
            single decision. Both washes and the star colour are theme tokens, so parchment gets a
            pale sky rather than a dark flourish painted over a light page.
          </p>
          <p className="max-w-prose">
            There is exactly one. Never mount a second, and never put an opaque full-bleed
            background over it — that is what the translucent section tones are for.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- the rest */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="line-art">
          Line-art motifs
        </Heading>
        <div className="grid gap-6 sm:grid-cols-3">
          {MOTIFS.map(({ name, Comp }) => (
            <figure key={name} className="space-y-3 rounded-xl border p-6">
              <div className="mx-auto max-w-48 text-accent-strong">
                <Comp />
              </div>
              <figcaption className="text-center">
                <code className="text-xs">{`<${name} />`}</code>
              </figcaption>
            </figure>
          ))}
        </div>

        <figure className="space-y-3 rounded-xl border p-6">
          <div className="text-accent-strong opacity-70">
            <AstronomicalLines decorative />
          </div>
          <figcaption className="text-center">
            <code className="text-xs">{"<AstronomicalLines decorative />"}</code>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
