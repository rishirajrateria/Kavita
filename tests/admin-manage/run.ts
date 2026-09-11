/**
 * Admin management tests (Phase 5 P5-C) — `pnpm test:admin-manage`. Plain tsx scripts, no
 * runner, no network; the integration file runs against PGlite with the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as exportsRun } from "./exports.test";
import { run as integration } from "./integration.test";
import { run as settings } from "./settings.test";
import { run as validators } from "./validators.test";

async function main() {
  validators();
  settings();
  exportsRun();
  await integration();
  finish("admin-manage");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
