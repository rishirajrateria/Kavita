/**
 * Config that `/robots.txt` is rendered from (CLAUDE.md §8 "Crawl & indexing", §9.7).
 *
 * Every AI crawler gets its own named group with `Allow: /`, annotated `retrieval` or
 * `training` so the site owner can see which bots govern training use and toggle them
 * deliberately (Phase 6 moves `enabled` into the admin). Nothing here is read from `new Date()`.
 */

export type BotPurpose = "retrieval" | "training" | "search" | "retrieval+training";

export interface BotGroup {
  userAgent: string;
  /** Who the bot is, one line. */
  vendor: string;
  purpose: BotPurpose;
  /** Phase 6 toggles this from the admin; disabled bots get `Disallow: /`. */
  enabled: boolean;
}

/** Paths every crawler is kept out of. `/book` is reachable but `noindex`ed by the page itself. */
export const ROBOTS_DISALLOW: readonly string[] = ["/admin", "/api/", "/_next/", "/design-system"];

/** The §9.7 list, in the brief's order. `purpose` follows the note under §9.7. */
export const AI_BOT_GROUPS: readonly BotGroup[] = [
  { userAgent: "GPTBot", vendor: "OpenAI", purpose: "training", enabled: true },
  { userAgent: "OAI-SearchBot", vendor: "OpenAI", purpose: "retrieval", enabled: true },
  { userAgent: "ChatGPT-User", vendor: "OpenAI", purpose: "retrieval", enabled: true },
  { userAgent: "ClaudeBot", vendor: "Anthropic", purpose: "retrieval+training", enabled: true },
  { userAgent: "Claude-Web", vendor: "Anthropic", purpose: "retrieval", enabled: true },
  { userAgent: "anthropic-ai", vendor: "Anthropic", purpose: "training", enabled: true },
  { userAgent: "PerplexityBot", vendor: "Perplexity", purpose: "retrieval", enabled: true },
  { userAgent: "Google-Extended", vendor: "Google", purpose: "training", enabled: true },
  { userAgent: "Bingbot", vendor: "Microsoft", purpose: "search", enabled: true },
  { userAgent: "Applebot", vendor: "Apple (Siri, Spotlight)", purpose: "retrieval", enabled: true },
  { userAgent: "Applebot-Extended", vendor: "Apple", purpose: "training", enabled: true },
  { userAgent: "Amazonbot", vendor: "Amazon (Alexa)", purpose: "retrieval", enabled: true },
  { userAgent: "Bytespider", vendor: "ByteDance", purpose: "training", enabled: true },
  { userAgent: "CCBot", vendor: "Common Crawl", purpose: "training", enabled: true },
  { userAgent: "Meta-ExternalAgent", vendor: "Meta", purpose: "retrieval+training", enabled: true },
];

/** Sitemap files advertised in robots.txt, relative to the site root. */
export const ROBOTS_SITEMAPS: readonly string[] = ["/sitemap.xml"];

export interface RobotsConfig {
  disallow: readonly string[];
  bots: readonly BotGroup[];
  sitemaps: readonly string[];
}

export const ROBOTS_CONFIG: RobotsConfig = {
  disallow: ROBOTS_DISALLOW,
  bots: AI_BOT_GROUPS,
  sitemaps: ROBOTS_SITEMAPS,
};

/**
 * Render robots.txt. Pure: `siteUrl` is the absolute origin; the caller passes the config so
 * Phase 6 can feed an admin-edited copy.
 */
export function renderRobotsTxt(siteUrl: string, config: RobotsConfig = ROBOTS_CONFIG): string {
  const lines: string[] = [];
  lines.push("# robots.txt — Astrologer Kavita. Generated from src/lib/robots-config.ts.");
  lines.push("User-agent: *");
  for (const path of config.disallow) lines.push(`Disallow: ${path}`);
  lines.push("");

  for (const bot of config.bots) {
    lines.push(`# ${bot.vendor} — ${bot.purpose}`);
    lines.push(`User-agent: ${bot.userAgent}`);
    if (bot.enabled) {
      lines.push("Allow: /");
      for (const path of config.disallow) lines.push(`Disallow: ${path}`);
    } else {
      lines.push("Disallow: /");
    }
    lines.push("");
  }

  for (const sitemap of config.sitemaps) lines.push(`Sitemap: ${siteUrl}${sitemap}`);
  lines.push(`# llms: ${siteUrl}/llms.txt`);
  lines.push(`# llms-full: ${siteUrl}/llms-full.txt`);
  return `${lines.join("\n")}\n`;
}
