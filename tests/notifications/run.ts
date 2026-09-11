/**
 * Notification tests — `pnpm test:notifications`. Plain tsx scripts, no runner, no network, no
 * database: templates render to HTML and text, the in-memory ledger dedupes, and the cron
 * window maths is checked against a fixed clock.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as cronWindow } from "./cron-window.test";
import { run as dedupe } from "./dedupe.test";
import { run as templates } from "./templates.test";

async function main() {
  await templates();
  await dedupe();
  cronWindow();
  finish("notifications");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
