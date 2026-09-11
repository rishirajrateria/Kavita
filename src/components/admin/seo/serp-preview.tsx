"use client";

/**
 * Google-style result mockup with pixel-width measurement (Phase 6 P6-A). A canvas
 * `measureText` island: Arial 20px for the title (Google truncates around 600px) and Arial
 * 14px for the description (~920px per line, two lines on desktop). These are Google's
 * approximate desktop metrics, not a guarantee — the label says so. Listens to the editor's
 * `#title` and `#metaDescription` inputs so the mockup updates as the admin types.
 *
 * The measured widths are written straight into their DOM nodes from the effect (an external
 * system, not React state), so typing never triggers a cascading re-render.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const SERP_TITLE_PX = 600;
export const SERP_DESCRIPTION_PX = 920;

interface Props {
  url: string;
  fallbackTitle: string;
  fallbackDescription: string;
  initialTitle?: string | null;
  initialDescription?: string | null;
}

/** Mirrors the value of an input elsewhere on the page (the editor form). */
function useLinkedInput(id: string, initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const sync = () => setValue(el.value);
    if (el.value !== initial) sync();
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [id, initial]);
  return value;
}

export function SerpPreview({
  url,
  fallbackTitle,
  fallbackDescription,
  initialTitle,
  initialDescription,
}: Props) {
  const typedTitle = useLinkedInput("title", initialTitle ?? "");
  const typedDescription = useLinkedInput("metaDescription", initialDescription ?? "");
  const title = typedTitle.trim() || fallbackTitle;
  const description = typedDescription.trim() || fallbackDescription;
  const titlePx = useRef<HTMLSpanElement>(null);
  const descPx = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = document.createElement("canvas").getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    const write = (node: HTMLSpanElement | null, text: string, font: string, limit: number) => {
      if (!node || !ctx) return;
      ctx.font = font;
      const px = Math.round(ctx.measureText(text).width);
      node.textContent = `${px}px of ~${limit}px`;
      node.dataset.over = String(px > limit);
    };
    write(titlePx.current, title, "20px Arial", SERP_TITLE_PX);
    write(descPx.current, description, "14px Arial", SERP_DESCRIPTION_PX * 2);
  }, [title, description]);

  const crumbs = url
    .replace(/^https?:\/\//, "")
    .split("/")
    .filter(Boolean);
  const host = crumbs.shift() ?? "";

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border border-border bg-[#fff] p-4 text-[#1f1f1f] shadow-xs"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <div className="flex items-center gap-2 text-[12px] text-[#4d5156]">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#e8eaed] font-serif text-[11px] font-semibold text-[#5f6368]">
            K
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[14px] text-[#202124]">Astrologer Kavita</span>
            <span>
              {host}
              {crumbs.length ? ` › ${crumbs.join(" › ")}` : ""}
            </span>
          </span>
        </div>
        <p
          className="mt-1 max-w-[600px] overflow-hidden text-[20px] leading-[1.3] text-ellipsis whitespace-nowrap text-[#1a0dab]"
          aria-label="Title as it may appear"
        >
          {title}
        </p>
        <p className="mt-1 line-clamp-2 max-w-[920px] text-[14px] leading-[1.58] text-[#4d5156]">
          {description}
        </p>
      </div>
      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <Metric label="Title width" pxRef={titlePx} chars={title.length} charLimit={60} />
        <Metric
          label="Description width"
          pxRef={descPx}
          chars={description.length}
          charLimit={160}
        />
      </dl>
      <p className="text-[0.7rem] text-muted-foreground">
        Approximate: measured with Arial 20px / 14px in your browser, the closest public stand-in
        for Google&rsquo;s desktop rendering. Google may cut a long title or rewrite it.
      </p>
    </div>
  );
}

function Metric({
  label,
  pxRef,
  chars,
  charLimit,
}: {
  label: string;
  pxRef: React.RefObject<HTMLSpanElement | null>;
  chars: number;
  charLimit: number;
}) {
  return (
    <div className="rounded-md border border-border/70 px-3 py-2">
      <dt className="text-[0.68rem] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 tabular-nums">
        <span ref={pxRef} data-over="false" className="data-[over=true]:text-error">
          measuring…
        </span>{" "}
        · {chars} chars
        <span className={cn(chars > charLimit && "text-error")}>
          {chars > charLimit ? ` (over ${charLimit})` : ""}
        </span>
      </dd>
    </div>
  );
}
