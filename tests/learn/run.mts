/** Learn content tests — `pnpm test:learn`. Plain tsx scripts, no runner, no database. */
import { finish } from "./_assert.mjs";
import { run as articles } from "./articles.test.mjs";
import { run as glossary } from "./glossary.test.mjs";
import { run as sitemap } from "./sitemap.test.mjs";

async function main() {
  await articles();
  glossary();
  sitemap();
  finish("learn");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
