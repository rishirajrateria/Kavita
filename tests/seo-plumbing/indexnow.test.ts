import {
  INDEXNOW_MAX_URLS,
  buildIndexNowPayload,
  indexNowKeyPath,
  submitIndexNow,
} from "@/lib/indexnow";
import { check, equal } from "./_assert";

export async function run(): Promise<void> {
  const payload = buildIndexNowPayload(
    [
      "/about",
      "https://example.com/astrologer/india#x",
      "https://evil.example/steal",
      "/about",
      "not a url at all",
    ],
    "abc12345",
    "https://example.com",
  );
  equal(payload.host, "example.com", "host");
  equal(payload.key, "abc12345", "key");
  equal(payload.keyLocation, "https://example.com/abc12345.txt", "keyLocation");
  equal(payload.urlList.length, 2, "dedupe + drop foreign hosts");
  equal(payload.urlList[0], "https://example.com/about", "relative path absolutised");
  equal(payload.urlList[1], "https://example.com/astrologer/india", "hash stripped");
  equal(indexNowKeyPath("k"), "/k.txt", "key path");

  const many = buildIndexNowPayload(
    Array.from({ length: INDEXNOW_MAX_URLS + 10 }, (_, i) => `/p/${i}`),
    "abc12345",
    "https://example.com",
  );
  equal(many.urlList.length, INDEXNOW_MAX_URLS, "capped at protocol max");

  // No key → no network, no throw.
  const saved = process.env.INDEXNOW_KEY;
  delete process.env.INDEXNOW_KEY;
  let called = false;
  const result = await submitIndexNow(["/about"], (async () => {
    called = true;
    return new Response(null, { status: 200 });
  }) as typeof fetch);
  check(!called, "no fetch without a key");
  equal(result.status, null, "no status without a key");
  if (saved !== undefined) process.env.INDEXNOW_KEY = saved;
}
