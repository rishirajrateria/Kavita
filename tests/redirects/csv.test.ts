/**
 * CSV import/export round-trip (Phase 6, P6-B). The parser is hand-rolled, so quoting,
 * embedded commas and newlines, CRLF line endings, header reordering and per-line errors are
 * all pinned here.
 */
import { check, equal } from "../seo-plumbing/_assert";
import { parseCsv, parseRedirectsCsv, toCsv, type CsvRedirectRow } from "@/lib/redirects/csv";

export function run(): void {
  // --- low-level parser ---
  equal(parseCsv("a,b\r\nc,d\r\n").length, 2, "CRLF rows parsed");
  equal(parseCsv('a,"b,c"')[0]?.[1], "b,c", "quoted comma kept");
  equal(parseCsv('a,"say ""hi"""')[0]?.[1], 'say "hi"', "doubled quotes unescaped");
  equal(parseCsv('a,"two\nlines"')[0]?.[1], "two\nlines", "quoted newline kept");
  equal(parseCsv("a,b\n\n\nc,d").length, 2, "blank lines skipped");

  // --- round-trip ---
  const rows: CsvRedirectRow[] = [
    {
      source: "/old-page",
      destination: "/new-page",
      type: 301,
      note: "Renamed, 2026",
      match: "exact",
    },
    {
      source: "/promo",
      destination: "/services",
      type: 302,
      note: 'Said "temporary", check',
      match: "exact",
    },
    {
      source: "/blog/*",
      destination: "/learn/$1",
      type: 301,
      note: "Moved, with a comma, here",
      match: "wildcard",
    },
    { source: "/dead", destination: "", type: 410, note: "", match: "exact" },
  ];
  const csv = toCsv(rows);
  check(csv.startsWith("source,destination,type,note,match"), "header written first");
  const back = parseRedirectsCsv(csv);
  equal(back.errors.length, 0, "round-trip has no errors");
  equal(back.rows.length, rows.length, "round-trip keeps every row");
  for (const [i, row] of rows.entries()) {
    equal(back.rows[i]?.source, row.source, `row ${i} source survives`);
    equal(back.rows[i]?.destination, row.destination, `row ${i} destination survives`);
    equal(back.rows[i]?.type, row.type, `row ${i} status survives`);
    equal(back.rows[i]?.note, row.note, `row ${i} note survives (quotes and commas)`);
    equal(back.rows[i]?.match, row.match, `row ${i} match type survives`);
  }

  // --- columns in another order, and a missing header ---
  const reordered = parseRedirectsCsv("note,type,destination,source\nWhy,302,/b,/a\n");
  equal(reordered.rows[0]?.source, "/a", "columns matched by name, not position");
  equal(reordered.rows[0]?.type, 302, "status read from its own column");
  const headerless = parseRedirectsCsv("/a,/b\n");
  equal(headerless.rows[0]?.destination, "/b", "headerless file uses the default column order");
  equal(headerless.rows[0]?.type, 301, "status defaults to 301");

  // --- per-line errors ---
  const bad = parseRedirectsCsv(
    [
      "source,destination,type,note",
      ",/b,301,no source",
      "/a,,301,no destination",
      "/c,/d,399,bad status",
      "/e,/f,301,ok",
    ].join("\n"),
  );
  equal(bad.rows.length, 1, "only the valid row is imported");
  equal(bad.errors.length, 3, "three lines rejected");
  equal(bad.errors[0]?.line, 2, "error line numbers account for the header");
  check(
    bad.errors.some((e) => e.message.includes("destination")),
    "a non-410 row without a destination is rejected",
  );
  equal(parseRedirectsCsv("").rows.length, 0, "empty file parses to nothing");
  equal(
    parseRedirectsCsv("source,destination,type,note\n/x,,410,gone\n").rows[0]?.type,
    410,
    "a 410 row may omit its destination",
  );
}
