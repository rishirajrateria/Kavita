/**
 * SEO health + audit revert tests (Phase 6 P6-D) — `pnpm test:seo-health`. Plain tsx scripts:
 * parser/check fixtures, the crawler against a fake site, and the store/runner + generic
 * revert against PGlite with the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { runCrawl } from "./crawl.test";
import { runIntegration } from "./integration.test";
import { runParse } from "./parse.test";

async function main() {
  runParse();
  await runCrawl();
  await runIntegration();
  finish("seo-health");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
