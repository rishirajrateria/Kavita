import { cn } from "@/lib/utils";

/**
 * The living sky behind the whole document — the site's largest piece of movement.
 *
 * Five layers, and the order is the design:
 *
 *   1-3. Three aurora washes, each a large soft gradient drifting on its own clock (64s, 92s,
 *        128s). Because the periods do not divide into one another, the combined pattern does
 *        not visibly repeat — the colour genuinely moves without ever looking like a loop.
 *   4.   A drifting field of warm embers, so the dark reads as night rather than as a dark UI.
 *   5.   A vignette, which is what stops the whole thing feeling like a flat panel.
 *
 * Everything animates transform only, so the browser composites it on the GPU and the whole sky
 * costs roughly one layer rather than five repaints. Glass also needs something to refract —
 * `backdrop-filter` over a flat fill is just a tinted rectangle — so this component and the
 * `.glass` utility in globals.css are one decision split across two files.
 *
 * Fixed, `pointer-events: none`, behind everything (`-z-10`), and entirely decorative: it holds
 * no text, so the server-rendered content is untouched and `prefers-reduced-motion` simply gets
 * the same sky standing still. Every colour is a token, so the daylight theme is the same
 * construction at much lower intensity rather than a separate treatment.
 */
export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{ background: "var(--background)" }}
    >
      <div
        data-aurora="a"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(38% 34% at 28% 26%, var(--aurora-1), transparent 70%)",
        }}
      />
      <div
        data-aurora="b"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(42% 36% at 74% 18%, var(--aurora-2), transparent 72%)",
        }}
      />
      <div
        data-aurora="c"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(46% 40% at 56% 88%, var(--aurora-3), transparent 74%)",
        }}
      />

      {/* Embers: eight sizes on one tiled layer — a single paint and no DOM. `inset: -25%`
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

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(125% 95% at 50% 42%, transparent 52%, var(--vignette) 100%)",
        }}
      />
    </div>
  );
}
