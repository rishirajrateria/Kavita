import { cn } from "@/lib/utils";

/**
 * The Earth's lit horizon — the curve of the planet at the bottom-left of the landing scene, a
 * thin blue atmosphere along its rim and the lights of cities along the dark side, turning very
 * slowly so the lights drift the way they do from orbit. This is what says "you have left the
 * ground" before the chart says anything.
 *
 * One SVG, positioned so only the upper-right arc is on screen. The city lights are generated
 * once at render (a deterministic pseudo-random walk along the arc) and rotate as a group with
 * `data-turn`; the atmosphere breathes. Decorative and `aria-hidden`; no text, no JavaScript.
 */
const LIGHTS = (() => {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 140; i++) {
    const a = ((-118 + rnd() * 150) * Math.PI) / 180; // the arc that faces the viewer
    const rad = 472 + (rnd() - 0.5) * 14;
    out.push({
      x: 500 + rad * Math.cos(a),
      y: 500 + rad * Math.sin(a),
      r: 0.7 + rnd() * 1.6,
      o: 0.35 + rnd() * 0.65,
    });
  }
  return out;
})();

export function EarthHorizon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 1000"
      data-parallax
      className={cn(
        "pointer-events-none absolute -bottom-[92%] -left-[52%] w-[120vw] max-w-[1700px] overflow-visible md:-bottom-[110%] md:-left-[46%] md:w-[110vw]",
        className,
      )}
      style={{ ["--parallax-depth" as string]: "28px" }}
    >
      <defs>
        <radialGradient id="eh-body" cx="62%" cy="18%" r="80%">
          <stop offset="0" stopColor="#101a33" />
          <stop offset="0.45" stopColor="#070b18" />
          <stop offset="1" stopColor="#020308" />
        </radialGradient>
        <radialGradient id="eh-glow">
          <stop offset="0.92" stopColor="#4f7fe0" stopOpacity="0" />
          <stop offset="0.965" stopColor="#5d8ff0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7fb0ff" stopOpacity="0" />
        </radialGradient>
        <filter id="eh-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* atmosphere */}
      <circle data-breathe cx="500" cy="500" r="520" fill="url(#eh-glow)" />
      <circle
        cx="500"
        cy="500"
        r="481"
        fill="none"
        stroke="#7fb0ff"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        filter="url(#eh-blur)"
      />
      {/* the planet */}
      <circle cx="500" cy="500" r="480" fill="url(#eh-body)" />
      {/* cities, turning with the planet */}
      <g data-turn style={{ ["--turn-duration" as string]: "1400s" }} fill="#f5d08a">
        {LIGHTS.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={l.r} opacity={l.o} />
        ))}
      </g>
    </svg>
  );
}
