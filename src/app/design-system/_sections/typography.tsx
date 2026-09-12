import { Heading } from "@/components/ui/heading";
import { Prose } from "@/components/ui/prose";

const TYPE_STEPS = [
  ["text-6xl", "text-6xl"],
  ["text-5xl", "text-5xl"],
  ["text-4xl", "text-4xl"],
  ["text-3xl", "text-3xl"],
  ["text-2xl", "text-2xl"],
  ["text-xl", "text-xl"],
  ["text-lg", "text-lg"],
  ["text-base", "text-base"],
  ["text-sm", "text-sm"],
  ["text-xs", "text-xs"],
] as const;

const SPACING = [
  { token: "--space-gutter", cls: "px-gutter", note: "Page side gutter (fluid)" },
  { token: "--space-section-sm", cls: "py-section-sm", note: "Compact section band" },
  { token: "--space-section-md", cls: "py-section-md", note: "Default section band" },
  { token: "--space-section-lg", cls: "py-section-lg", note: "Hero / feature band" },
] as const;

const RADII = [
  "rounded-xs",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
] as const;
const SHADOWS = [
  "shadow-xs",
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-gold",
] as const;

export function TypographySection() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Heading as="h2" level={2} id="typography">
          Typography
        </Heading>
        <p className="max-w-prose text-muted-foreground">
          Cormorant (variable, self-hosted) for headings via <code>font-serif</code>; Karla
          (variable, self-hosted) for body via <code>font-sans</code>. Only the upright faces are
          shipped and preloaded — italics are synthesized, because the italic files cost ~97KB of
          render-critical bytes. Sizes are fluid <code>clamp()</code> steps between 360px and 1280px
          viewports. Cormorant is high-contrast, so the display steps run at{" "}
          <code>font-normal</code> with tighter tracking and only pick up weight at the small end.
        </p>
      </div>

      <div className="space-y-4">
        {TYPE_STEPS.map(([label, cls]) => (
          <div
            key={label}
            className="grid items-baseline gap-2 border-b pb-3 sm:grid-cols-[6rem_1fr]"
          >
            <code className="text-xs text-muted-foreground">{label}</code>
            <p className={`font-serif ${cls} truncate`}>The chart and the home, read together</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Heading component
        </Heading>
        <div className="space-y-4 rounded-lg border p-6">
          <Heading as="p" level="display">
            Display
          </Heading>
          <Heading as="p" level={1}>
            Level 1 — page title
          </Heading>
          <Heading as="p" level={2} eyebrow="Eyebrow line">
            Level 2 with eyebrow
          </Heading>
          <Heading as="p" level={3} tone="accent">
            Level 3, accent tone
          </Heading>
          <Heading as="p" level={4} tone="muted">
            Level 4, muted tone
          </Heading>
          <Heading as="p" level={5}>
            Level 5
          </Heading>
          <Heading as="p" level={6}>
            Level 6
          </Heading>
        </div>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4}>
          Prose and the answer block
        </Heading>
        <Prose>
          <h2>Is this an example question heading?</h2>
          <p className="answer">
            Yes. This paragraph uses the <code>.answer</code> class: a self-contained forty-to-sixty
            word statement placed directly under a question heading so that an assistant can quote
            it on its own without needing the surrounding text.
          </p>
          <p>
            Regular prose paragraphs follow. Sample text only — no claims. A{" "}
            <a href="#typography">link inside prose</a> is gold with a soft underline.
          </p>
          <ul>
            <li>List items inherit the relaxed leading.</li>
            <li>Nested elements keep the vertical rhythm from a single stack token.</li>
          </ul>
          <blockquote>A quotation block uses the serif italic and a gold rule.</blockquote>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>What it answers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Astrology</td>
                <td>What is happening in a life, and when</td>
              </tr>
              <tr>
                <td>Vastu</td>
                <td>What in the physical space amplifies or blocks it</td>
              </tr>
            </tbody>
          </table>
        </Prose>
      </div>

      <div className="space-y-3">
        <Heading as="h3" level={4} id="spacing">
          Spacing, radii, shadows
        </Heading>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            {SPACING.map((s) => (
              <div key={s.token} className="rounded-md border p-3">
                <code className="text-xs">{s.token}</code>
                <p className="text-xs text-muted-foreground">
                  {s.note} · <code>{s.cls}</code>
                </p>
                <div
                  className="mt-2 h-2 rounded-full bg-accent-border"
                  style={{ width: `var(${s.token})` }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {RADII.map((r) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <div className={`size-14 border bg-muted ${r}`} />
                <code className="text-xs text-muted-foreground">{r}</code>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {SHADOWS.map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`size-14 rounded-lg bg-card ${s}`} />
                <code className="text-xs text-muted-foreground">{s}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
