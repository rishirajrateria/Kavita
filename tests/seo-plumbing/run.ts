/**
 * SEO plumbing tests — `pnpm test:seo`. Plain tsx scripts, no runner, no network, no database:
 * every generator is exercised as a pure function.
 */
import { finish } from "./_assert";
import { run as indexnow } from "./indexnow.test";
import { run as markdown } from "./markdown.test";
import { run as robots } from "./robots.test";
import { run as routes } from "./routes.test";
import { run as sitemaps } from "./sitemaps.test";

async function main() {
  routes();
  robots();
  markdown();
  await indexnow();
  await sitemaps();
  finish("seo-plumbing");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
