/**
 * Hand-built mockups of how a shared link renders on WhatsApp, X, LinkedIn and Facebook
 * (Phase 6 P6-A). No network calls and no platform SDKs: each card is plain markup styled to
 * each platform's own proportions, so the owner can see a too-long title being cut before she
 * publishes. WhatsApp comes first and largest — for this audience it is where links are shared.
 */
import { cn } from "@/lib/utils";

export interface SocialCardData {
  url: string;
  title: string;
  description: string;
  /** Absolute image URL; `null` renders each platform's "no image" state. */
  imageUrl: string | null;
  imageAlt?: string;
  /** `summary` renders X's small square card instead of the large one. */
  twitterCard?: "summary" | "summary_large_image";
}

function host(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  }
}

/** 1200×630 frame; `next/image` is deliberately not used (arbitrary remote hosts). */
function Preview({
  src,
  alt,
  className,
  ratio = "1200 / 630",
}: {
  src: string | null;
  alt: string;
  className?: string;
  ratio?: string;
}) {
  if (!src) {
    return (
      <div
        style={{ aspectRatio: ratio }}
        className={cn(
          "flex w-full items-center justify-center bg-[#e9edef] text-[11px] text-[#667781]",
          className,
        )}
      >
        No image — the platform will show a link-only card
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote preview image
    <img
      src={src}
      alt={alt}
      style={{ aspectRatio: ratio }}
      className={cn("w-full bg-[#e9edef] object-cover", className)}
    />
  );
}

function CardShell({
  platform,
  note,
  children,
  wide,
}: {
  platform: string;
  note: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className={cn("m-0 flex flex-col gap-2", wide && "sm:col-span-2")}>
      <figcaption className="flex flex-wrap items-baseline gap-2">
        <span className="text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
          {platform}
        </span>
        <span className="text-xs text-muted-foreground">{note}</span>
      </figcaption>
      {children}
    </figure>
  );
}

/** WhatsApp: the preview sits inside the outgoing (green) bubble, title 2 lines, body 2 lines. */
export function WhatsAppCard({ data }: { data: SocialCardData }) {
  return (
    <CardShell platform="WhatsApp" note="Outgoing message · title cut after 2 lines" wide>
      <div className="rounded-lg bg-[#0b141a] p-4">
        <div className="ml-auto max-w-[420px] rounded-lg rounded-tr-none bg-[#005c4b] p-1.5 shadow-md">
          <div className="overflow-hidden rounded-md bg-[#025144]">
            <Preview src={data.imageUrl} alt={data.imageAlt ?? ""} />
            <div className="px-2.5 py-2">
              <p className="line-clamp-2 text-[13px] leading-snug font-medium text-[#e9edef]">
                {data.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#8696a0]">
                {data.description}
              </p>
              <p className="mt-1 text-[12px] text-[#8696a0]">{host(data.url)}</p>
            </div>
          </div>
          <p className="px-1.5 pt-1.5 pb-0.5 text-[13px] break-all text-[#a5d6c7]">{data.url}</p>
        </div>
      </div>
    </CardShell>
  );
}

export function XCard({ data }: { data: SocialCardData }) {
  const small = data.twitterCard === "summary";
  return (
    <CardShell
      platform="X (Twitter)"
      note={small ? "summary — small square image" : "summary_large_image"}
    >
      <div className="overflow-hidden rounded-2xl border border-[#2f3336] bg-black text-[#e7e9ea]">
        {small ? (
          <div className="flex">
            <div className="w-[120px] shrink-0 border-r border-[#2f3336]">
              <Preview src={data.imageUrl} alt={data.imageAlt ?? ""} ratio="1 / 1" />
            </div>
            <div className="min-w-0 px-3 py-2.5">
              <p className="text-[13px] text-[#71767b]">{host(data.url)}</p>
              <p className="line-clamp-2 text-[15px] leading-snug">{data.title}</p>
              <p className="line-clamp-2 text-[15px] leading-snug text-[#71767b]">
                {data.description}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Preview src={data.imageUrl} alt={data.imageAlt ?? ""} />
            <div className="px-3 py-2.5">
              <p className="text-[13px] text-[#71767b]">{host(data.url)}</p>
              <p className="line-clamp-1 text-[15px] leading-snug">{data.title}</p>
            </div>
          </>
        )}
      </div>
    </CardShell>
  );
}

export function LinkedInCard({ data }: { data: SocialCardData }) {
  return (
    <CardShell platform="LinkedIn" note="Feed post · description usually dropped">
      <div className="overflow-hidden rounded-sm border border-[#d0d5dc] bg-white text-[#000000e6] shadow-xs">
        <Preview src={data.imageUrl} alt={data.imageAlt ?? ""} />
        <div className="bg-[#f4f2ee] px-3 py-2.5">
          <p className="line-clamp-2 text-[14px] leading-snug font-semibold">{data.title}</p>
          <p className="mt-0.5 text-[12px] text-[#00000099]">{host(data.url)}</p>
        </div>
      </div>
    </CardShell>
  );
}

export function FacebookCard({ data }: { data: SocialCardData }) {
  return (
    <CardShell platform="Facebook" note="Feed link card · 1 line title, 1 line description">
      <div className="overflow-hidden rounded-lg border border-[#dddfe2] bg-white text-[#1c1e21]">
        <Preview src={data.imageUrl} alt={data.imageAlt ?? ""} />
        <div className="bg-[#f2f3f5] px-3 py-2.5">
          <p className="text-[12px] tracking-wide text-[#606770] uppercase">{host(data.url)}</p>
          <p className="mt-0.5 line-clamp-1 text-[16px] leading-snug font-semibold">{data.title}</p>
          <p className="line-clamp-1 text-[14px] text-[#606770]">{data.description}</p>
        </div>
      </div>
    </CardShell>
  );
}

/** All four, WhatsApp first and full width. */
export function SocialCardPreviews({ data }: { data: SocialCardData }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <WhatsAppCard data={data} />
      <XCard data={data} />
      <LinkedInCard data={data} />
      <FacebookCard data={data} />
    </div>
  );
}
