/**
 * Admin dashboard tests — `pnpm test:admin`. Plain tsx scripts, no runner, no network. The
 * panels file spins up PGlite, seeds the analytics dataset and times every query.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as auth } from "./auth.test";
import { run as charts } from "./charts.test";
import { run as filters } from "./filters.test";
import { run as panels } from "./panels.test";
import { run as proxy } from "./proxy.test";

async function main() {
  filters();
  charts();
  await auth();
  await proxy();
  await panels();
  finish("admin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
