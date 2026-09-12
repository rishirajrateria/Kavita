import { EarthHorizon, KundliNav } from "@/components/motifs";
import { Container } from "@/components/ui/container";
import { HUB } from "@/content/home";

/**
 * The landing scene — built to the client's reference composition.
 *
 * You arrive in space: the Earth's lit horizon curves across the bottom-left, the Milky Way's
 * dust crosses the right, and in front of you a chart is waiting. Above it, two lines only:
 * "Your Kundli" and the practice in seven words. Beside it, on wide screens, two quiet columns of
 * three words each. Below it, three verbs. Everything else the page has to say is further down.
 *
 * Every element moves, slowly: the planet turns, its atmosphere breathes, the band drifts, the
 * chart draws itself and then keeps flowing, the planets rotate and float, the centre breathes.
 * All CSS. The H1, the tagline and the twelve house links are in the served HTML.
 */
function SideColumn({
  words,
  ornament,
  side,
}: {
  words: readonly string[];
  ornament: "star" | "moon";
  side: "left" | "right";
}) {
  return (
    <aside
      aria-hidden="true"
      className={`absolute top-1/2 hidden w-[9rem] -translate-y-1/2 flex-col items-center gap-5 text-center min-[1400px]:flex ${
        side === "left" ? "-left-[10.5rem]" : "-right-[10.5rem]"
      }`}
    >
      <span className="h-16 w-px bg-linear-to-b from-transparent via-accent-border/60 to-accent-border/60" />
      {ornament === "star" ? (
        <svg data-pulse viewBox="0 0 24 24" className="size-6 text-accent-strong">
          <path
            d="M12 0c.6 7.4 4.6 11.4 12 12-7.4.6-11.4 4.6-12 12-.6-7.4-4.6-11.4-12-12 7.4-.6 11.4-4.6 12-12Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg data-sway viewBox="0 0 32 32" className="size-6 text-accent-strong">
          <path d="M18 4a12 12 0 1 0 0 24 9.5 12 0 1 1 0-24Z" fill="currentColor" />
        </svg>
      )}
      <p className="font-display text-[0.66rem] leading-[2.1] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
        {words.map((w) => (
          <span key={w} className="block">
            {w}
          </span>
        ))}
      </p>
      <span className="h-16 w-px bg-linear-to-t from-transparent via-accent-border/60 to-accent-border/60" />
    </aside>
  );
}

export function Hero() {
  return (
    <header className="relative isolate flex flex-col justify-center overflow-hidden py-10 lg:min-h-[calc(100svh-5rem)] lg:py-8">
      {/* the Milky Way's dust, crossing the right of the scene */}
      <div
        aria-hidden="true"
        data-aurora="c"
        className="pointer-events-none absolute -top-[30%] -right-[18%] h-[170%] w-[58%] -rotate-[32deg] opacity-70 blur-3xl"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgb(196 182 255 / 0.10) 42%, rgb(255 240 220 / 0.09) 56%, transparent 100%)",
        }}
      />
      <EarthHorizon />

      <Container size="wide" className="relative">
        <div className="text-center">
          <h1 className="font-display text-[clamp(2.1rem,1.2rem+4.2vw,4.4rem)] leading-none font-medium tracking-[0.14em] text-display-title uppercase">
            {HUB.title}
          </h1>
          <p className="mx-auto mt-5 flex max-w-[44rem] items-center justify-center gap-4 font-display text-[clamp(0.62rem,0.5rem+0.5vw,0.82rem)] font-semibold tracking-[0.34em] text-accent-strong uppercase">
            <span aria-hidden="true" className="h-px w-10 shrink-0 bg-accent-border/70 sm:w-16" />
            <span>{HUB.tagline}</span>
            <span aria-hidden="true" className="h-px w-10 shrink-0 bg-accent-border/70 sm:w-16" />
          </p>
        </div>

        <div className="relative mx-auto mt-8 w-full max-w-[min(94vw,64rem)] sm:mt-10 lg:mt-8 lg:max-w-[min(94vw,64rem,calc((100svh-22rem)*1.5))]">
          <SideColumn words={HUB.sideLeft} ornament="star" side="left" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[150%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, var(--glow), transparent 70%)" }}
          />
          <KundliNav houses={HUB.houses} centre={HUB.centre} />
          <SideColumn words={HUB.sideRight} ornament="moon" side="right" />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10">
          <svg
            data-pulse
            viewBox="0 0 24 24"
            className="size-5 text-accent-strong"
            aria-hidden="true"
          >
            <path
              d="M12 0c.6 7.4 4.6 11.4 12 12-7.4.6-11.4 4.6-12 12-.6-7.4-4.6-11.4-12-12 7.4-.6 11.4-4.6 12-12Z"
              fill="currentColor"
            />
          </svg>
          <p className="font-display text-[0.62rem] font-semibold tracking-[0.36em] text-muted-foreground uppercase">
            {HUB.words.join("  ·  ")}
          </p>
          <p className="sr-only">{HUB.hint}</p>
        </div>
      </Container>
    </header>
  );
}
