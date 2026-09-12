import { cn } from "@/lib/utils";

/**
 * The gradient wash behind the whole document.
 *
 * This exists for two reasons, in order of importance:
 *
 *   1. Glass needs something to refract. A `backdrop-filter` over a flat fill produces a
 *      slightly tinted rectangle and nothing else; over two drifting colour washes it produces
 *      the depth the direction depends on. The `.glass` utility in globals.css and this
 *      component are one design decision in two files.
 *   2. It is where the palette's red actually lives. Red is the accent, not a field colour —
 *      putting it here, at 14–30% alpha and blurred across hundreds of pixels, gives the page
 *      its warmth without ever laying saturated red behind body text.
 *
 * Fixed, `pointer-events: none`, behind everything (`-z-10`), and entirely decorative: it holds
 * no text, so the server-rendered content is untouched. Both washes come from theme tokens, so
 * it re-themes with the rest of the site rather than being a light-only flourish.
 */
export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{
        background:
          "radial-gradient(110% 70% at 78% -8%, var(--sky-warm), transparent 60%)," +
          "radial-gradient(95% 65% at 12% 104%, var(--sky-cool), transparent 64%)," +
          "var(--background)",
      }}
    >
      {/*
       * A third, slowly drifting wash. `inset: -25%` gives the drift room to move without ever
       * exposing an edge, and the whole field costs one paint and no DOM.
       */}
      <div
        data-drift
        className="absolute -inset-[25%] opacity-70"
        style={{
          background:
            "radial-gradient(42% 38% at 30% 28%, var(--sky-warm), transparent 70%)," +
            "radial-gradient(38% 34% at 72% 66%, var(--sky-cool), transparent 72%)",
        }}
      />
    </div>
  );
}
