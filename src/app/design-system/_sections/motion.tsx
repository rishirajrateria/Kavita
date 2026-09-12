import type { ReactNode } from "react";
import { VastuCompass } from "@/components/motifs";
import { Callout } from "@/components/ui/callout";
import { Heading } from "@/components/ui/heading";

const ATTRS = [
  {
    attr: "data-draw",
    what: "A stroke that draws itself in, once, on load.",
    knobs: (
      <>
        <code>--draw-length</code> (default <code>1400</code>) must roughly match the path length,
        and <code>--draw-delay</code> staggers several strokes into a sequence.
      </>
    ),
  },
  {
    attr: "data-turn",
    what: "Anything circular: a compass rose, a ring of house ticks.",
    knobs: (
      <>
        <code>--turn-duration</code> (default <code>240s</code>) — one turn every four minutes. If
        you can see it move as movement, it is too fast.
      </>
    ),
  },
  {
    attr: "data-breathe",
    what: "Ambient linework that should feel alive rather than printed.",
    knobs: <>An 11s opacity cycle between 0.75 and 1. No knobs.</>,
  },
  {
    attr: "data-drift",
    what: "The starfield behind the whole document, and nothing else so far.",
    knobs: <>A 150s alternating translate of a few rem. Give the layer inset slack to move into.</>,
  },
] as const;

function Demo({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <figure className="space-y-3">
      <div className="glass grid aspect-[4/3] place-items-center overflow-hidden p-6">
        {children}
      </div>
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

export function MotionSection() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Heading as="h2" level={2} id="motion">
          Motion
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Four data attributes, defined once in <code>src/app/globals.css</code>, all CSS, no
          JavaScript and no scroll observers. Put the attribute on the element; the keyframes and
          the reduced-motion guard come with it.
        </p>
        <Callout variant="info" title="Every animation rests in its finished state">
          Nothing is parked at <code>opacity: 0</code> waiting to be revealed. The drawing is
          complete, the text is present and the page is readable before a single frame runs — which
          is what keeps the server-rendered content the thing crawlers and reduced-motion visitors
          actually get. All four attributes live inside{" "}
          <code>@media (prefers-reduced-motion: no-preference)</code>, so reduced motion simply gets
          the finished figure.
        </Callout>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Demo
          label={
            <>
              <code>data-draw</code> · reload the page to replay
            </>
          }
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            className="size-28 text-accent-strong"
            aria-hidden="true"
          >
            <rect data-draw x="8" y="8" width="84" height="84" className="[--draw-length:336]" />
            <path
              data-draw
              d="M8 8 92 92 M92 8 8 92"
              className="[--draw-delay:0.5s] [--draw-length:238]"
            />
            <path
              data-draw
              d="M50 8 92 50 50 92 8 50Z"
              className="[--draw-delay:1s] [--draw-length:238]"
            />
          </svg>
        </Demo>

        <Demo
          label={
            <>
              <code>data-turn</code> · shown at <code>--turn-duration: 24s</code>
            </>
          }
        >
          <VastuCompass
            decorative
            data-turn
            className="size-28 text-accent-strong [--turn-duration:24s]"
          />
        </Demo>

        <Demo
          label={
            <>
              <code>data-breathe</code> · 11s opacity cycle
            </>
          }
        >
          <div data-breathe className="mandala-grid size-28 rounded-sm" />
        </Demo>

        <Demo
          label={
            <>
              <code>data-drift</code> · the sky&apos;s own 150s drift
            </>
          }
        >
          <div className="relative size-full overflow-hidden rounded-sm">
            <div
              data-drift
              className="absolute -inset-[40%]"
              style={{
                backgroundSize: "8rem 8rem",
                backgroundImage: [
                  "radial-gradient(1.6px 1.6px at 18% 22%, var(--accent-strong), transparent)",
                  "radial-gradient(1.3px 1.3px at 74% 14%, var(--accent-strong), transparent)",
                  "radial-gradient(1.5px 1.5px at 42% 62%, var(--accent-strong), transparent)",
                  "radial-gradient(1.2px 1.2px at 88% 48%, var(--accent-strong), transparent)",
                  "radial-gradient(1.4px 1.4px at 8% 78%, var(--accent-strong), transparent)",
                ].join(","),
              }}
            />
          </div>
        </Demo>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-semibold">Attribute</th>
              <th className="px-3 py-2 text-left font-semibold">Use it for</th>
              <th className="px-3 py-2 text-left font-semibold">Knobs</th>
            </tr>
          </thead>
          <tbody>
            {ATTRS.map((row) => (
              <tr key={row.attr} className="border-b align-top">
                <td className="px-3 py-3">
                  <code className="text-xs whitespace-nowrap">{row.attr}</code>
                </td>
                <td className="px-3 py-3">{row.what}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.knobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout variant="warn" title="data-breathe animates opacity — so it wins">
        A static <code>opacity-[0.08]</code> on the same element is overridden by the keyframes for
        as long as the animation runs, and a faint backdrop suddenly renders at full strength. Put
        the fade on a wrapper and the attribute on the child.
      </Callout>

      <div className="space-y-3">
        <Heading as="h3" level={4} id="hover">
          Hover micro-interactions
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          One gesture, used everywhere: a 2px lift and a gold hairline over roughly 300ms, on{" "}
          <code>ease-(--ease-standard)</code>. No bounce, no scale, no shadow bloom.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="#hover"
            className="glass block p-5 no-underline transition-[transform,border-color] duration-300 ease-(--ease-standard) hover:-translate-y-0.5 hover:border-accent-border"
          >
            <span className="block font-serif text-lg text-foreground">Hover me</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              <code>hover:-translate-y-0.5 hover:border-accent-border</code>
            </span>
          </a>
          <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            Non-interactive panels do not move. The lift is a promise that something will happen on
            click; anything that lifts must also be focusable and show a visible focus ring.
          </div>
        </div>
      </div>
    </div>
  );
}
