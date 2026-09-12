import { cn } from "@/lib/utils";

/**
 * The night sky behind the whole document — built to the client's reference photograph: an
 * indigo-black sky, the Milky Way in violet and rose, a warm gold horizon along the bottom
 * where the land's lights meet it, and a great many stars.
 *
 * Six layers, and the order is the design:
 *
 *   1-3. Three washes, each drifting on its own clock (64s, 92s, 128s). The periods do not divide
 *        into one another, so the combined pattern never visibly repeats — the colour genuinely
 *        moves without ever reading as a loop. Violet sits high like the galaxy's core, rose
 *        drifts across the middle, gold pools along the horizon.
 *   4-5. Two star fields: a dense faint one that reads as the Milky Way's dust, and a sparser
 *        bright one for the stars you would actually pick out. They drift at different speeds,
 *        which is what gives the sky depth rather than the look of a single wallpaper.
 *   6.   A vignette, which is what stops it feeling like a flat panel.
 *
 * Everything animates transform only, so the browser composites the whole sky on the GPU at
 * roughly the cost of one layer. Glass needs something to refract — `backdrop-filter` over a
 * flat fill is just a tinted rectangle — so this component and `.glass` in globals.css are one
 * decision in two files.
 *
 * Fixed, `pointer-events: none`, behind everything (`-z-10`), and entirely decorative: it holds
 * no text, so the server-rendered content is untouched and `prefers-reduced-motion` gets the
 * same sky standing still. Every colour is a token, so the daylight theme is the same
 * construction at much lower intensity rather than a separate treatment.
 */
export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{ background: "var(--background)" }}
    >
      {/* Violet — the galaxy's core, high and off-centre */}
      <div
        data-aurora="a"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(44% 30% at 40% 30%, var(--aurora-1), transparent 70%)",
        }}
      />
      {/* Rose — the aurora's edge, sweeping across the middle */}
      <div
        data-aurora="b"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(52% 26% at 30% 58%, var(--aurora-2), transparent 72%)",
        }}
      />
      {/* Gold — pooled along the horizon, the way the town lights sit under the sky */}
      <div
        data-aurora="c"
        className="absolute -inset-[30%]"
        style={{
          background: "radial-gradient(70% 22% at 55% 96%, var(--aurora-3), transparent 74%)",
        }}
      />

      {/* Dense faint field — the galaxy's dust. Tiled small so it reads as thousands. */}
      <div
        data-drift
        className="absolute -inset-[25%]"
        style={{
          backgroundSize: "19rem 19rem",
          backgroundImage: [
            "radial-gradient(0.8px 0.8px at 12% 18%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 63% 9%, var(--star-faint), transparent)",
            "radial-gradient(0.9px 0.9px at 38% 44%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 84% 37%, var(--star-faint), transparent)",
            "radial-gradient(0.8px 0.8px at 21% 71%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 55% 83%, var(--star-faint), transparent)",
            "radial-gradient(0.9px 0.9px at 92% 66%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 47% 27%, var(--star-faint), transparent)",
            "radial-gradient(0.8px 0.8px at 73% 55%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 6% 52%, var(--star-faint), transparent)",
            "radial-gradient(0.8px 0.8px at 30% 93%, var(--star-faint), transparent)",
            "radial-gradient(0.7px 0.7px at 97% 13%, var(--star-faint), transparent)",
          ].join(","),
        }}
      />

      {/* Sparse bright field — the stars you would pick out. Larger tile, slower drift. */}
      <div
        data-aurora="b"
        className="absolute -inset-[25%]"
        style={{
          backgroundSize: "44rem 44rem",
          backgroundImage: [
            "radial-gradient(1.6px 1.6px at 18% 22%, var(--star), transparent)",
            "radial-gradient(1.1px 1.1px at 74% 14%, var(--star), transparent)",
            "radial-gradient(1.4px 1.4px at 42% 62%, var(--star), transparent)",
            "radial-gradient(1px 1px at 88% 48%, var(--star), transparent)",
            "radial-gradient(1.2px 1.2px at 8% 74%, var(--star), transparent)",
            "radial-gradient(1px 1px at 58% 86%, var(--star), transparent)",
            "radial-gradient(1.8px 1.8px at 30% 38%, var(--star), transparent)",
            "radial-gradient(1px 1px at 66% 70%, var(--star), transparent)",
            "radial-gradient(1.3px 1.3px at 51% 8%, var(--star), transparent)",
            "radial-gradient(1px 1px at 95% 90%, var(--star), transparent)",
          ].join(","),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(125% 95% at 50% 42%, transparent 50%, var(--vignette) 100%)",
        }}
      />
    </div>
  );
}
