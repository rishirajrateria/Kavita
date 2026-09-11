/**
 * Integrations, consent and pixel tests (Phase 6, P6-C) — `pnpm test:integrations`. Plain tsx
 * scripts, no runner, no network: every network-shaped test injects its own `fetch`.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as capi } from "./capi.test";
import { run as sanitize } from "./sanitize.test";
import { run as secrets } from "./secrets.test";
import { run as whatLoads } from "./what-loads.test";

async function main() {
  whatLoads();
  sanitize();
  secrets();
  await capi();
  finish("integrations");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
