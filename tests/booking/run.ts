/**
 * Booking engine tests — `pnpm test:booking`. Plain tsx scripts, no runner, no network. The
 * integration file spins up PGlite (Postgres-in-WASM) and applies the real migrations.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as crypto } from "./crypto.test";
import { run as ics } from "./ics.test";
import { run as integration } from "./integration.test";
import { run as payments } from "./payments.test";
import { run as schemas } from "./schemas.test";
import { run as slots } from "./slots.test";
import { run as tokens } from "./tokens.test";

async function main() {
  slots();
  tokens();
  crypto();
  schemas();
  ics();
  await payments();
  await integration();
  finish("booking");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
