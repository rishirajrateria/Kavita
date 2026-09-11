/**
 * Config that `/robots.txt` is rendered from (CLAUDE.md §8 "Crawl & indexing", §9.7).
 *
 * Every AI crawler gets its own named group with `Allow: /`, annotated `retrieval` or
 * `training` so the site owner can see which bots govern training use and toggle them
 * deliberately from the admin (`robots_bots` rows, applied by `getRobotsConfig()`; Phase 6).
 * Nothing here is read from `new Date()`.
 */
import { getDb } from "@/db";

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
 * The config with admin toggles applied: a `robots_bots` row per user-agent overrides
 * `enabled` (and adds a `note`). No database, or a failing one, yields the static config.
 */
export async function getRobotsConfig(): Promise<RobotsConfig> {
  const db = getDb();
  if (!db) return ROBOTS_CONFIG;
  try {
    const rows = await db.query.robotsBots.findMany();
    if (rows.length === 0) return ROBOTS_CONFIG;
    const byAgent = new Map(rows.map((r) => [r.agent.toLowerCase(), r]));
    return {
      ...ROBOTS_CONFIG,
      bots: AI_BOT_GROUPS.map((bot) => {
        const row = byAgent.get(bot.userAgent.toLowerCase());
        return row ? { ...bot, enabled: row.allow } : bot;
      }),
    };
  } catch (error) {
    console.error(
      "[robots] robots_bots lookup failed:",
      error instanceof Error ? error.name : error,
    );
    return ROBOTS_CONFIG;
  }
}

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
