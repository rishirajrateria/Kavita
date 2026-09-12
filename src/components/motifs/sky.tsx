import { cn } from "@/lib/utils";

/**
 * The lit darkness behind the whole document.
 *
 * Three layers, and the order is the design:
 *
 *   1. Two deep vermilion/oxblood washes bedded into the ground — where the page's red actually
 *      lives. Blurred across hundreds of pixels at low alpha, so red is atmosphere rather than a
 *      field behind text, which is the thing that makes a red palette fatiguing.
 *   2. A drifting field of warm-white embers. This is the "white" in red-and-white doing its real
 *      job: light emerging from dark. A flat dark ground reads as a dark UI; embers read as night.
 *   3. A vignette, which is what stops the whole thing feeling like a flat panel.
 *
 * Glass also needs something to refract — `backdrop-filter` over a flat fill is just a tinted
 * rectangle — so this component and the `.glass` utility in globals.css are one decision split
 * across two files.
 *
 * Fixed, `pointer-events: none`, behind everything (`-z-10`), entirely decorative: it holds no
 * text, so the server-rendered content is untouched. Every colour is a theme token, so the light
 * ground gets the same construction at much lower intensity rather than a separate treatment.
 */
export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{
        background:
          "radial-gradient(105% 70% at 76% -10%, var(--sky-warm), transparent 58%)," +
          "radial-gradient(95% 65% at 10% 106%, var(--sky-cool), transparent 62%)," +
          "var(--background)",
      }}
    >
      {/* Embers. Eight sizes on one tiled layer: a single paint, no DOM, and `inset: -25%`
          gives the drift room to move without ever exposing an edge. */}
      <div
        data-drift
        className="absolute -inset-[25%]"
        style={{
          backgroundSize: "44rem 44rem",
          backgroundImage: [
            "radial-gradient(1.5px 1.5px at 18% 22%, var(--star), transparent)",
            "radial-gradient(1.1px 1.1px at 74% 14%, var(--star), transparent)",
            "radial-gradient(1.3px 1.3px at 42% 62%, var(--star), transparent)",
            "radial-gradient(1px 1px at 88% 48%, var(--star), transparent)",
            "radial-gradient(1.2px 1.2px at 8% 74%, var(--star), transparent)",
            "radial-gradient(1px 1px at 58% 86%, var(--star), transparent)",
            "radial-gradient(1.6px 1.6px at 30% 38%, var(--star), transparent)",
            "radial-gradient(1px 1px at 66% 70%, var(--star), transparent)",
          ].join(","),
        }}
      />

      {/* A slow bloom behind the upper third, so the accent has something to glow into. */}
      <div
        data-breathe
        className="absolute inset-0"
        style={{
          background: "radial-gradient(50% 38% at 62% 12%, var(--glow), transparent 72%)",
        }}
      />

      {/* Vignette last: darkens the corners so the page reads as depth, not as a flat panel. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(125% 95% at 50% 42%, transparent 52%, var(--vignette) 100%)",
        }}
      />
    </div>
  );
}
