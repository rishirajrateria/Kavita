import { Callout } from "@/components/ui/callout";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

const CASCADE = [
  {
    selector: ":root",
    palette: "Midnight — deep indigo ground, ivory text, antique gold accent",
    how: "The default. Every visitor gets this, whatever their operating system prefers.",
  },
  {
    selector: ':root[data-theme="light"]',
    palette: "Parchment — warm ivory ground, midnight text, darker gold accent",
    how: "Reached only by choosing it in the theme toggle. ThemeScript persists the choice.",
  },
] as const;

const GLASS_TOKENS = [
  ["--glass-fill", "The pane itself. A wash, not a colour — it must let the sky through."],
  ["--glass-edge", "1px border. The pane's physical rim."],
  ["--glass-spec", "Specular top lip and the diagonal sweep across the upper third."],
  ["--glass-shade", "Shaded bottom lip, so the sheet has a near and a far edge."],
  ["--glass-shadow", "The cast shadow that lifts it off the sky."],
  ["--glass-blur", "26px midnight / 22px parchment."],
  ["--glass-saturate", "Pushes the colour behind the pane, which is what reads as glass."],
] as const;

export function FoundationSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <Heading as="h2" level={2} id="foundation">
          Foundation
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Midnight is the identity, not a preference. Everything below follows from that one
          decision: the token cascade, the translucent section tones, the frosted panes, the very
          slow celestial motion. Components read semantic tokens only — never a primitive ramp,
          never a raw hex — so retargeting <code>src/styles/tokens.css</code> re-themes the site.
        </p>
      </div>

      {/* ---------------------------------------------------------------- theme cascade */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="theme-cascade">
          The theme cascade
        </Heading>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold">Selector</th>
                <th className="px-3 py-2 text-left font-semibold">Palette</th>
                <th className="px-3 py-2 text-left font-semibold">How a visitor gets there</th>
              </tr>
            </thead>
            <tbody>
              {CASCADE.map((row) => (
                <tr key={row.selector} className="border-b align-top">
                  <td className="px-3 py-3">
                    <code className="text-xs whitespace-nowrap">{row.selector}</code>
                  </td>
                  <td className="px-3 py-3">{row.palette}</td>
                  <td className="px-3 py-3 text-muted-foreground">{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout variant="warn" title="prefers-color-scheme deliberately does not switch the theme">
          There is no <code>@media (prefers-color-scheme: light)</code> block anywhere in the token
          file, and adding one would be a regression. A practice read at night that turns into a
          white document on a light laptop is not the same practice. The OS preference is honoured
          only through <code>color-scheme</code>, which is set per palette so form controls and
          scrollbars match — the colours themselves move on an explicit choice and nothing else.
        </Callout>
        <p className="max-w-prose text-sm text-muted-foreground">
          The consequence for the <code>dark:</code> variant: midnight is the common case, so{" "}
          <code>dark:</code> fires on a bare <code>:root</code> as well as on{" "}
          <code>[data-theme=&quot;dark&quot;]</code>. Use it only for the handful of structural
          overrides that colour tokens cannot express — a colour that works in one palette and not
          the other is a bug, not a variant.
        </p>
      </div>

      {/* ---------------------------------------------------------------- surfaces */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="surfaces">
          Surfaces are panes, not bands
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          <code>&lt;Sky /&gt;</code> is mounted once in the root layout and sits behind the entire
          document. Section tones are therefore translucent: rhythm comes from panes of differing
          density over one continuous night, never from opaque blocks painted over it.{" "}
          <code>tone=&quot;default&quot;</code> adds no fill at all.
        </p>
        <div className="space-y-4">
          {(
            [
              ["default", "No fill. The sky, straight through."],
              ["muted", "bg-surface-muted/60 — a slightly denser pane."],
              ["gold", "bg-surface-gold/55 — warmed, for a single feature band."],
              ["inverse", "bg-background/92 — deep; re-points every semantic token."],
            ] as const
          ).map(([tone, note]) => (
            <figure key={tone}>
              {/*
               * The swatch is empty and the caption sits on the page ground beneath it: text on a
               * translucent band is the thing to measure per palette rather than assume, and the
               * callout under this list is what that measurement cost once already.
               */}
              <Section
                spacing="none"
                tone={tone}
                aria-hidden="true"
                className="h-16 rounded-lg border border-dashed border-border"
              />
              <figcaption className="mt-2 text-sm text-muted-foreground">
                <code className="text-xs">tone=&quot;{tone}&quot;</code> — {note}
              </figcaption>
            </figure>
          ))}
        </div>

        <Callout variant="info" title="Why the inverse band is near-opaque and the others are not">
          <code>tone=&quot;inverse&quot;</code> re-points every semantic token, including the text,
          to the ivory-on-indigo set — so the band underneath it has to actually be dark in both
          palettes. At 55% a midnight veil over parchment composited to mid-grey and ivory body text
          fell to 2.1:1. It is <code>bg-background/92</code> instead, painted from{" "}
          <code>--background</code> rather than <code>--surface-inverse</code> so that{" "}
          <code>data-depth=&quot;deep&quot;</code>, which works by re-pointing{" "}
          <code>--background</code>, still has an effect. That reads 7.3:1 for muted text in
          parchment, and glass placed inside the band still refracts, because{" "}
          <code>backdrop-filter</code> blurs whatever is behind it.
        </Callout>
      </div>

      {/* ---------------------------------------------------------------- glass */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="glass">
          <code className="font-serif">.glass</code> — a frosted plate over the sky
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          One utility, declared in <code>src/app/globals.css</code>. A fill, a rim, a specular top
          lip, a shaded bottom lip, a diagonal sweep and a cast shadow, plus{" "}
          <code>backdrop-filter</code>. It only works over moving content — over a flat fill the
          blur has nothing to refract, which is why <code>&lt;Sky /&gt;</code> and{" "}
          <code>.glass</code> are one decision in two files.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass p-6">
            <p className="font-serif text-lg">Spend it here</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Things that are genuinely objects: a key-facts slab, a booking step, a testimonial,
              the sticky header. One or two per section.
            </p>
          </div>
          <div className="glass p-6">
            <p className="font-serif text-lg">Not here</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every box on the page. A screen of glass rectangles is exactly as flat as a screen of
              white ones — the lift only reads against something that is not lifted.
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-6">
            <p className="font-serif text-lg">Or here</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Quiet content sits on nothing at all, separated by a hairline rule. This panel is a
              dashed border and no fill — the contrast is what makes the two on its left objects.
            </p>
          </div>
        </div>

        <Callout
          variant="warn"
          title="Declare backdrop-filter once, unprefixed — and never re-add the -webkit- line"
        >
          Lightning CSS adds the <code>-webkit-</code> spelling itself, from the browser targets.
          Hand-writing the prefixed and unprefixed pair makes it merge them down to the prefixed
          declaration <em>alone</em>, which this Chromium does not support — so every plate on the
          site silently became a flat 4.5%-white rectangle with no blur at all. A healthy plate
          computes <code>blur(26px) saturate(1.55)</code>; if it computes <code>none</code>, this is
          why.
        </Callout>

        <div className="glass mt-2 p-6">
          <p className="text-sm font-semibold">Tokens</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
            {GLASS_TOKENS.map(([token, note]) => (
              <div key={token} className="contents">
                <dt>
                  <code className="text-xs whitespace-nowrap">{token}</code>
                </dt>
                <dd className="text-muted-foreground">{note}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-dashed p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">
              The sweep sits behind the content, not over it
            </p>
            <p className="mt-2">
              <code>.glass</code> sets <code>isolation: isolate</code> and{" "}
              <code>.glass::before</code> sits at <code>z-index: -1</code>. Unpositioned text
              children paint before any positioned descendant, so without this the diagonal
              highlight washed straight over the words — very visible on parchment.
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-5 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">
              A plate on an inverse band is a dark plate
            </p>
            <p className="mt-2">
              <code>[data-tone=&quot;inverse&quot;]</code> re-points the whole{" "}
              <code>--glass-*</code> family along with <code>--mandala</code>,{" "}
              <code>--mandala-strong</code> and <code>--star</code> to their midnight values. So
              glass inside a dark band reads correctly in parchment too, instead of dropping a
              bright frosted sheet onto a near-black ground.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- mandala grid */}
      <div className="space-y-4">
        <Heading as="h3" level={4} id="mandala-grid">
          <code className="font-serif">.mandala-grid</code>
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          The vastu purusha mandala&apos;s 9×9 pada grid, drawn with two repeating gradients rather
          than eighteen <code>&lt;line&gt;</code> elements: one paint, no DOM. Colour comes from{" "}
          <code>--mandala</code>, so it re-themes. Use it as a backdrop at very low contrast, or
          under the Instrument.
        </p>
        <div className="flex flex-wrap items-end gap-6">
          <figure className="space-y-2">
            <div className="mandala-grid size-40 rounded-sm" />
            <figcaption className="text-xs text-muted-foreground">
              <code>.mandala-grid</code>
            </figcaption>
          </figure>
          <figure className="space-y-2">
            <div className="mandala-grid size-40 rounded-sm [--mandala:var(--mandala-strong)]" />
            <figcaption className="text-xs text-muted-foreground">
              <code>--mandala: var(--mandala-strong)</code>
            </figcaption>
          </figure>
          <figure className="space-y-2">
            <div className="glass grid size-40 place-items-center">
              <div className="mandala-grid size-24 rounded-sm" />
            </div>
            <figcaption className="text-xs text-muted-foreground">
              grid inside <code>.glass</code>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
