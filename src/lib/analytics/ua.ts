/**
 * Small hand-written user-agent parser: device class, OS family, browser family and a bot
 * verdict. Coarse on purpose — the dashboard needs "mobile / Android / Chrome", not versions,
 * and nothing here becomes part of any identifier except through the daily-salted hash.
 */
import type { DeviceType } from "@/db/schema/analytics";

export interface UaInfo {
  deviceType: DeviceType;
  os: string;
  browser: string;
  isBot: boolean;
}

const BOT_MARKERS = [
  "bot",
  "crawler",
  "spider",
  "slurp",
  "curl/",
  "wget/",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "java/",
  "okhttp",
  "libwww",
  "httpclient",
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
  "selenium",
  "lighthouse",
  "chrome-lighthouse",
  "pagespeed",
  "gtmetrix",
  "pingdom",
  "uptimerobot",
  "facebookexternalhit",
  "embedly",
  "quora link preview",
  "whatsapp/",
  "telegrambot",
  "skypeuripreview",
  "slackbot",
  "twitterbot",
  "discordbot",
  "applebot",
  "bingpreview",
  "yandex",
  "baiduspider",
  "duckduckbot",
  "semrush",
  "ahrefs",
  "mj12bot",
  "dotbot",
  "petalbot",
  "bytespider",
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "ccbot",
  "amazonbot",
  "meta-externalagent",
  "google-extended",
  "adsbot",
  "mediapartners",
  "feedfetcher",
  "vercel-screenshot",
  "node-fetch",
  "axios/",
  "undici",
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.trim().length < 8) return true;
  const lower = ua.toLowerCase();
  return BOT_MARKERS.some((m) => lower.includes(m));
}

function osOf(ua: string): string {
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  if (/android/.test(ua)) return "Android";
  if (/windows nt|windows phone/.test(ua)) return "Windows";
  if (/cros/.test(ua)) return "ChromeOS";
  if (/mac os x|macintosh/.test(ua)) return "macOS";
  if (/linux/.test(ua)) return "Linux";
  return "Other";
}

function browserOf(ua: string): string {
  if (/edg(e|a|ios)?\//.test(ua)) return "Edge";
  if (/opr\/|opera/.test(ua)) return "Opera";
  if (/samsungbrowser/.test(ua)) return "Samsung Internet";
  if (/ucbrowser/.test(ua)) return "UC Browser";
  if (/firefox|fxios/.test(ua)) return "Firefox";
  if (/crios/.test(ua)) return "Chrome";
  if (/chrome|chromium/.test(ua)) return "Chrome";
  if (/safari/.test(ua) && /version\//.test(ua)) return "Safari";
  if (/safari/.test(ua)) return "Safari";
  return "Other";
}

function deviceOf(ua: string): Exclude<DeviceType, "bot"> {
  if (/ipad|tablet|kindle|silk|playbook/.test(ua)) return "tablet";
  if (/android/.test(ua) && !/mobile/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|windows phone|opera mini/.test(ua)) return "mobile";
  return "desktop";
}

export function parseUserAgent(ua: string | null | undefined): UaInfo {
  if (isBotUserAgent(ua)) return { deviceType: "bot", os: "Other", browser: "Bot", isBot: true };
  const lower = (ua ?? "").toLowerCase();
  return { deviceType: deviceOf(lower), os: osOf(lower), browser: browserOf(lower), isBot: false };
}

/** Headless / automation signals in request headers beyond the user agent. */
export function hasHeadlessMarkers(headers: Headers): boolean {
  const purpose = headers.get("purpose") ?? headers.get("sec-purpose") ?? "";
  if (/prefetch|preview/i.test(purpose)) return true;
  const fetchMode = headers.get("sec-fetch-mode");
  const fetchSite = headers.get("sec-fetch-site");
  // Browsers send `same-origin` for beacons and fetches from our pages; scripts do not.
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return true;
  if (fetchMode === "navigate") return true;
  return false;
}
