import type * as React from "react";
import type { SocialPlatform } from "@/lib/data/types";

/**
 * Inline line-art social icons drawn in the site's own stroke style (no brand-asset
 * reproduction, no icon font, no CDN). All use `currentColor`, are 20px by default and are
 * `aria-hidden` — the surrounding link carries the accessible name.
 */

export type SocialIconKey = SocialPlatform | "google" | "link";

export interface SocialIconProps extends Omit<React.ComponentProps<"svg">, "children"> {
  /** Icon key from `social_links.icon`, falling back to the platform, then a generic link. */
  name: string;
  size?: number;
}

type Glyph = React.ReactNode;

const GLYPHS: Record<SocialIconKey, Glyph> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="17.25" cy="6.75" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9.25v5.5l4.75-2.75z" />
    </>
  ),
  facebook: (
    <path d="M14 21v-8h2.5l.5-3H14V8.25c0-.9.35-1.5 1.5-1.5H17V4.1c-.3-.05-1.4-.1-2.5-.1-2.5 0-4 1.5-4 4.1V10H8v3h2.5v8" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 10.5V17M8 7.25v.01M12 17v-3.5a2.25 2.25 0 0 1 4.5 0V17M12 10.5V17" />
    </>
  ),
  x: (
    <>
      <path d="M4.5 4h4l11 16h-4z" />
      <path d="M19.5 4l-6.4 7.3M4.5 20l6.5-7.4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 3.25a8.75 8.75 0 0 0-7.55 13.2L3.25 20.75l4.45-1.15A8.75 8.75 0 1 0 12 3.25z" />
      <path d="M9.1 8.4c.15-.35.45-.4.7-.4h.55c.2 0 .4.15.5.4l.65 1.55c.1.25.05.45-.1.6l-.5.6a7.3 7.3 0 0 0 2.7 2.7l.6-.5c.15-.15.35-.2.6-.1l1.55.65c.25.1.4.3.4.5v.55c0 .55-.35 1.05-.85 1.2-1.4.45-3.4-.35-5.1-2.05S7.7 10.4 8.15 9c.15-.3.5-.5.95-.6z" />
    </>
  ),
  telegram: (
    <>
      <path d="M21 4L3.25 11.15l6.15 2.15L11.75 20l3.1-4.4 4.65 3.4z" />
      <path d="M9.4 13.3L21 4" />
    </>
  ),
  pinterest: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.75 20.75c.55-1.75 1.35-5.2 2.15-8.55" />
      <path d="M11.15 12.3c-.85 1.95 1.4 2.9 2.7 1.5 1.5-1.65 1.9-4.35.4-5.65-1.6-1.4-5-.75-5.65 2.2-.2 1 0 1.75.5 2.4" />
    </>
  ),
  threads: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16.6 11c-.4-2.3-2-3.5-4.4-3.5-2.7 0-4.5 1.8-4.5 4.5s1.8 4.5 4.5 4.5c2.3 0 3.9-1.3 3.9-3 0-1.7-1.5-2.6-3.5-2.6-1.8 0-2.8.8-2.8 1.9s1 1.7 2.3 1.7c1.7 0 2.7-1 2.9-3.4" />
    </>
  ),
  google_business: (
    <>
      <path d="M12 21.25s-6.25-5.6-6.25-10.5a6.25 6.25 0 0 1 12.5 0c0 4.9-6.25 10.5-6.25 10.5z" />
      <path d="M14.5 10.75H12V9.6M14.5 10.75a2.6 2.6 0 1 1-.75-1.85" />
    </>
  ),
  google: (
    <>
      <path d="M12 21.25s-6.25-5.6-6.25-10.5a6.25 6.25 0 0 1 12.5 0c0 4.9-6.25 10.5-6.25 10.5z" />
      <path d="M14.5 10.75H12V9.6M14.5 10.75a2.6 2.6 0 1 1-.75-1.85" />
    </>
  ),
  other: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" />
    </>
  ),
};

function isIconKey(key: string): key is SocialIconKey {
  return Object.prototype.hasOwnProperty.call(GLYPHS, key);
}

/** Resolve a `social_links.icon` / platform pair to a glyph key. */
export function resolveSocialIcon(icon: string, platform?: string): SocialIconKey {
  if (isIconKey(icon)) return icon;
  if (platform && isIconKey(platform)) return platform;
  return "other";
}

export function SocialIcon({ name, size = 20, ...props }: SocialIconProps) {
  const key = isIconKey(name) ? name : "other";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={key}
      {...props}
    >
      {GLYPHS[key]}
    </svg>
  );
}
