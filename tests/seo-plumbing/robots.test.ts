import { AI_BOT_GROUPS, ROBOTS_CONFIG, renderRobotsTxt } from "@/lib/robots-config";
import { check, equal, includes } from "./_assert";

const REQUIRED_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "Meta-ExternalAgent",
];

export function run(): void {
  const txt = renderRobotsTxt("https://example.com");
  includes(
    txt,
    "User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /_next/\nDisallow: /design-system",
    "default group",
  );
  for (const bot of REQUIRED_BOTS) {
    includes(txt, `User-agent: ${bot}\nAllow: /`, `named group for ${bot}`);
    check(
      AI_BOT_GROUPS.some((g) => g.userAgent === bot),
      `${bot} configured`,
    );
  }
  includes(txt, "Sitemap: https://example.com/sitemap.xml", "sitemap line");
  includes(txt, "# llms: https://example.com/llms.txt", "llms line");
  includes(txt, "# llms-full: https://example.com/llms-full.txt", "llms-full line");
  check(/# .* — (training|retrieval|search|retrieval\+training)\n/.test(txt), "purpose comments");

  const disabled = renderRobotsTxt("https://example.com", {
    ...ROBOTS_CONFIG,
    bots: [{ userAgent: "Bytespider", vendor: "ByteDance", purpose: "training", enabled: false }],
  });
  includes(disabled, "User-agent: Bytespider\nDisallow: /", "disabled bot is blocked");
  equal(txt.endsWith("\n"), true, "trailing newline");
}
