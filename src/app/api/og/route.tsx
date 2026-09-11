import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

/**
 * On-brand Open Graph image, 1200×630: ivory ground, double gold hairline frame, gold eyebrow,
 * indigo Fraunces title, the "Astrologer Kavita" wordmark and a line-art motif — vastu compass
 * or North Indian chart — drawn as SVG. `?title=&subtitle=&kind=astrologer|vastu`.
 *
 * Satori accepts only ttf/otf/woff, so the variable woff2 files shipped by @fontsource are
 * instanced once (Fraunces 500, Inter 400/600, latin subset) into `./fonts/*.ttf` — ~170KB in
 * total — and read from disk on first use. Node runtime; long cache headers.
 */
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;
const IVORY = "#fdfbf7";
const IVORY_DEEP = "#efe8db";
const INDIGO = "#161a33";
const INDIGO_SOFT = "#3a3f63";
const GOLD = "#b8923a";
const GOLD_TEXT = "#7a5c27";

const FONTS_DIR = join(process.cwd(), "src/app/api/og/fonts");

let fontsPromise:
  | Promise<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" }[]>
  | undefined;

/** Fonts do not depend on the request: read once per process. */
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(FONTS_DIR, "fraunces-500.ttf")),
    readFile(join(FONTS_DIR, "inter-400.ttf")),
    readFile(join(FONTS_DIR, "inter-600.ttf")),
  ]).then(([fraunces, inter400, inter600]) => [
    {
      name: "Fraunces",
      data: toArrayBuffer(fraunces),
      weight: 500 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: toArrayBuffer(inter400),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: toArrayBuffer(inter600),
      weight: 600 as const,
      style: "normal" as const,
    },
  ]);
  return fontsPromise;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** Trim and cap a query value; strips control characters so nothing odd reaches the renderer. */
function clean(value: string | null, max: number, fallback: string): string {
  const text = (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function Compass() {
  const spokes = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg
      width="520"
      height="520"
      viewBox="-100 -100 200 200"
      fill="none"
      stroke={GOLD}
      strokeWidth="0.7"
    >
      <circle r="96" />
      <circle r="78" />
      <circle r="52" strokeDasharray="2 3" />
      <circle r="26" />
      <circle r="3" fill={GOLD} stroke="none" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="0"
          y1="-96"
          x2="0"
          y2={deg % 90 === 0 ? "-26" : deg % 45 === 0 ? "-52" : "-78"}
          transform={`rotate(${deg})`}
        />
      ))}
      <path d="M0 -96 L6 -74 L0 -80 L-6 -74 Z" fill={GOLD} stroke="none" />
    </svg>
  );
}

function Chart() {
  return (
    <svg width="520" height="520" viewBox="0 0 200 200" fill="none" stroke={GOLD} strokeWidth="0.7">
      <rect x="4" y="4" width="192" height="192" />
      <rect x="10" y="10" width="180" height="180" />
      <path d="M10 10 L190 190 M190 10 L10 190" />
      <path d="M100 10 L190 100 L100 190 L10 100 Z" />
      <circle cx="100" cy="100" r="3" fill={GOLD} stroke="none" />
    </svg>
  );
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const title = clean(sp.get("title"), 90, "Astrologer Kavita");
  const subtitle = clean(sp.get("subtitle"), 120, "Vedic astrology and vastu, read together");
  const kind = sp.get("kind") === "vastu" ? "vastu" : "astrologer";
  const eyebrow =
    kind === "vastu"
      ? "Vastu consultant · Vedic astrologer"
      : "Vedic astrologer · Vastu consultant";
  const titleSize = title.length > 48 ? 54 : title.length > 30 ? 64 : 76;

  try {
    const fonts = await loadFonts();
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${IVORY} 0%, ${IVORY_DEEP} 100%)`,
          fontFamily: "Inter",
          color: INDIGO,
          position: "relative",
        }}
      >
        {/* Double gold hairline frame */}
        <div
          style={{
            position: "absolute",
            inset: 26,
            border: `1px solid ${GOLD}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 34,
            border: `1px solid ${GOLD}`,
            opacity: 0.45,
            display: "flex",
          }}
        />
        {/* Motif, right, low opacity, partly clipped */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: 60,
            opacity: 0.55,
            display: "flex",
          }}
        >
          {kind === "vastu" ? <Compass /> : <Chart />}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "84px 96px 76px",
            width: 820,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: GOLD_TEXT,
              }}
            >
              <div
                style={{ width: 40, height: 1, background: GOLD, marginRight: 16, display: "flex" }}
              />
              {eyebrow}
            </div>
            <div
              style={{
                marginTop: 34,
                fontFamily: "Fraunces",
                fontSize: titleSize,
                lineHeight: 1.06,
                letterSpacing: -1,
                color: INDIGO,
                display: "flex",
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 26,
                fontSize: 26,
                lineHeight: 1.35,
                color: INDIGO_SOFT,
                display: "flex",
              }}
            >
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ fontFamily: "Fraunces", fontSize: 34, color: INDIGO, display: "flex" }}>
              Astrologer Kavita
            </div>
            <div
              style={{
                marginLeft: 18,
                fontSize: 18,
                color: GOLD_TEXT,
                letterSpacing: 2,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              One method, two instruments
            </div>
          </div>
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
        fonts,
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("og: failed to render", error instanceof Error ? error.message : error);
    return new Response("Failed to generate the image", { status: 500 });
  }
}
