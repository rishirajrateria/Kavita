/**
 * Analytics data-plane tests — `pnpm test:analytics`. Plain tsx scripts, no runner, no network.
 * The database-backed files spin up PGlite (Postgres-in-WASM) with the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as ingest } from "./ingest.test";
import { run as queries } from "./queries.test";
import { run as ranges } from "./ranges.test";
import { run as rollup } from "./rollup.test";
import { run as tracker } from "./tracker.test";

async function main() {
  tracker();
  ranges();
  await ingest();
  await rollup();
  await queries();
  finish("analytics");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
