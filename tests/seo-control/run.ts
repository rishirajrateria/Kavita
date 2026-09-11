/**
 * SEO control tests (Phase 6 P6-A) — `pnpm test:seo-control`. Plain tsx scripts, no runner and
 * no network; the integration file runs against PGlite with the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as aeo } from "./aeo.test";
import { run as answerOverrides } from "./answer-overrides.test";
import { run as integration } from "./integration.test";
import { run as metadata } from "./metadata.test";
import { run as patterns } from "./patterns.test";

async function main() {
  patterns();
  metadata();
  aeo();
  await integration();
  await answerOverrides();
  finish("seo-control");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
