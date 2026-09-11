/**
 * Referrer normalisation and acquisition-channel classification, shared by ingest (stored on
 * the session) and the acquisition panel (labels). Host lists are deliberately short and
 * explicit; anything unknown is a plain referral.
 */
import type { Channel } from "@/db/schema/analytics";

export const AI_REFERRER_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "gemini.google.com",
  "claude.ai",
  "copilot.microsoft.com",
  "bing.com/chat",
] as const;

export const SEARCH_ENGINE_HOSTS = [
  "google.",
  "bing.com",
  "duckduckgo.com",
  "yahoo.",
  "yandex.",
  "baidu.com",
  "ecosia.org",
  "brave.com",
  "ask.com",
  "startpage.com",
] as const;

export const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "x.com",
  "twitter.com",
  "t.co",
  "pinterest.",
  "threads.net",
  "whatsapp.com",
  "reddit.com",
  "quora.com",
  "telegram.",
  "t.me",
  "snapchat.com",
  "tiktok.com",
] as const;

/** Lower-cased host without a leading `www.`; `bing.com/chat` keeps its path marker. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "bing.com" && url.pathname.startsWith("/chat")) return "bing.com/chat";
    return host || null;
  } catch {
    return null;
  }
}

export function isAiReferrer(host: string | null): boolean {
  if (!host) return false;
  return AI_REFERRER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function isSearchEngine(host: string | null): boolean {
  if (!host) return false;
  return SEARCH_ENGINE_HOSTS.some((h) =>
    h.endsWith(".") ? host.includes(h) : host === h || host.endsWith(`.${h}`),
  );
}

export function isSocial(host: string | null): boolean {
  if (!host) return false;
  return SOCIAL_HOSTS.some((h) =>
    h.endsWith(".") ? host.includes(h) : host === h || host.endsWith(`.${h}`),
  );
}

export interface ChannelInput {
  referrerHost: string | null;
  siteHost: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function classifyChannel(input: ChannelInput): Channel {
  if (input.utmCampaign || input.utmMedium || input.utmSource) return "campaign";
  const host = input.referrerHost;
  if (
    !host ||
    (input.siteHost && (host === input.siteHost || host.endsWith(`.${input.siteHost}`)))
  ) {
    return "direct";
  }
  if (isAiReferrer(host)) return "ai";
  if (isSearchEngine(host)) return "search";
  if (isSocial(host)) return "social";
  return "referral";
}
