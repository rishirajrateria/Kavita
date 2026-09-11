/**
 * Redirect engine, 404 log, sitemap control and search-console tests (Phase 6, P6-B) —
 * `pnpm test:redirects`. Plain tsx scripts, no runner and no network; the integration file
 * runs against PGlite with the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as cache } from "./cache.test";
import { run as csv } from "./csv.test";
import { run as graph } from "./graph.test";
import { run as integration } from "./integration.test";
import { run as jwt } from "./jwt.test";
import { run as matchers } from "./matchers.test";

async function main() {
  matchers();
  cache();
  graph();
  csv();
  jwt();
  await integration();
  finish("redirects");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
