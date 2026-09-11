/** Assertion helpers for the Learn tests (same shape as `tests/seo-plumbing/_assert.ts`). */
export const failures: string[] = [];

export function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

export function equal<T>(actual: T, expected: T, message: string): void {
  check(
    actual === expected,
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

export function finish(name: string): void {
  if (failures.length > 0) {
    console.error(`${name}: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`${name}: ok`);
}
