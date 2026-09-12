import { cn } from "@/lib/utils";

/**
 * The night sky behind the whole document.
 *
 * This exists for two reasons, in order of importance:
 *
 *   1. Glass needs something to refract. A `backdrop-filter` over a flat fill produces a
 *      slightly tinted rectangle and nothing else; over a drifting starfield and two coloured
 *      washes it produces the depth the direction depends on. The `.glass` utility in
 *      globals.css and this component are one design decision in two files.
 *   2. It carries the only ambient motion on the page — a 150s drift, so slow it reads as
 *      atmosphere rather than animation.
 *
 * Fixed, `pointer-events: none`, behind everything (`-z-10`), and entirely decorative: it holds
 * no text, so it costs the server-rendered content nothing. Both washes and the star colour come
 * from theme tokens, so it re-themes with the rest of the site rather than being a dark-only
 * flourish painted over a parchment page.
 */
export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, var(--sky-warm), transparent 62%)," +
          "radial-gradient(90% 60% at 82% 108%, var(--sky-cool), transparent 68%)," +
          "var(--background)",
      }}
    >
      {/*
       * Eight star sizes on one tiled layer. Gradients rather than elements so the whole field
       * costs a single paint and no DOM; `inset: -20%` gives the drift room to move without
       * exposing an edge.
       */}
      <div
        data-drift
        className="absolute -inset-[20%] opacity-50"
        style={{
          backgroundSize: "46rem 46rem",
          backgroundImage: [
            "radial-gradient(1.4px 1.4px at 18% 22%, var(--star), transparent)",
            "radial-gradient(1.1px 1.1px at 74% 14%, var(--star), transparent)",
            "radial-gradient(1.3px 1.3px at 42% 62%, var(--star), transparent)",
            "radial-gradient(1px 1px at 88% 48%, var(--star), transparent)",
            "radial-gradient(1.2px 1.2px at 8% 74%, var(--star), transparent)",
            "radial-gradient(1px 1px at 58% 86%, var(--star), transparent)",
            "radial-gradient(1.5px 1.5px at 30% 38%, var(--star), transparent)",
            "radial-gradient(1px 1px at 66% 70%, var(--star), transparent)",
          ].join(","),
        }}
      />
    </div>
  );
}
