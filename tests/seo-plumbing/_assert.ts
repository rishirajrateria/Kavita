/** Tiny assertion helpers shared by the SEO plumbing tests (no test runner; tsx scripts). */
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

export function includes(haystack: string, needle: string, message: string): void {
  check(haystack.includes(needle), `${message}: missing ${JSON.stringify(needle)}`);
}

export function excludes(haystack: string, needle: string, message: string): void {
  check(!haystack.includes(needle), `${message}: unexpected ${JSON.stringify(needle)}`);
}

/**
 * Minimal XML well-formedness check: one declaration, balanced tags, no bare `&`, no `<` in
 * text. Enough to catch every mistake a sitemap generator can make without an XML parser.
 */
export function assertWellFormedXml(xml: string, label: string): void {
  check(
    xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),
    `${label}: missing XML declaration`,
  );
  const body = xml.replace(/^<\?xml[^>]*\?>\s*/, "");
  check(
    !/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/.test(body),
    `${label}: unescaped ampersand`,
  );
  const stack: string[] = [];
  const tagRe = /<(\/?)([A-Za-z_][\w:.-]*)[^>]*?(\/?)>/g;
  let match: RegExpExecArray | null;
  let last = 0;
  while ((match = tagRe.exec(body)) !== null) {
    const text = body.slice(last, match.index);
    check(!text.includes("<"), `${label}: bare "<" in text near ${text.slice(0, 40)}`);
    last = tagRe.lastIndex;
    const [, closing, name, selfClosing] = match;
    if (closing) {
      const open = stack.pop();
      check(open === name, `${label}: </${name}> closes <${open ?? "nothing"}>`);
    } else if (!selfClosing) {
      stack.push(name ?? "");
    }
  }
  check(stack.length === 0, `${label}: unclosed ${stack.join(", ")}`);
}

export function finish(name: string): void {
  if (failures.length > 0) {
    console.error(`${name}: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`${name}: ok`);
}
