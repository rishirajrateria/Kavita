/**
 * CSV import/export for redirects (Phase 6, P6-B). Hand-rolled RFC 4180 parser: quoted fields,
 * doubled quotes, CR/LF line endings, a header row that may arrive in any column order.
 * Columns: `source,destination,type,note` (+ optional `match`); `type` is the status code.
 */
import { REDIRECT_STATUSES, type RedirectMatchType } from "@/db/schema/redirects";

export interface CsvRedirectRow {
  source: string;
  destination: string;
  type: number;
  note: string;
  match: RedirectMatchType;
}

export interface CsvParseResult {
  rows: CsvRedirectRow[];
  /** `{ line, message }` for every skipped line. */
  errors: { line: number; message: string }[];
}

export const CSV_HEADER = ["source", "destination", "type", "note", "match"] as const;

/** Split CSV text into rows of fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(rows: readonly CsvRedirectRow[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push([r.source, r.destination, String(r.type), r.note, r.match].map(csvField).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

const MATCH_TYPES: readonly string[] = ["exact", "wildcard", "regex"];

/** Parse a redirects CSV; a missing header row is treated as `source,destination,type,note`. */
export function parseRedirectsCsv(text: string): CsvParseResult {
  const rows = parseCsv(text);
  const errors: CsvParseResult["errors"] = [];
  const out: CsvRedirectRow[] = [];
  if (rows.length === 0) return { rows: out, errors };

  const first = rows[0]?.map((f) => f.trim().toLowerCase()) ?? [];
  const hasHeader = first.includes("source") && first.includes("destination");
  const columns = hasHeader ? first : ["source", "destination", "type", "note", "match"];
  const col = (name: string) => columns.indexOf(name);
  const body = hasHeader ? rows.slice(1) : rows;

  body.forEach((fields, i) => {
    const line = i + (hasHeader ? 2 : 1);
    const get = (name: string) => (col(name) >= 0 ? (fields[col(name)] ?? "").trim() : "");
    const source = get("source");
    const destination = get("destination");
    const typeRaw = get("type") || "301";
    const type = Number(typeRaw);
    const match = (get("match") || "exact").toLowerCase();
    if (!source) return errors.push({ line, message: "missing source" });
    if (!(REDIRECT_STATUSES as readonly number[]).includes(type)) {
      return errors.push({ line, message: `type must be one of ${REDIRECT_STATUSES.join(", ")}` });
    }
    if (type !== 410 && !destination) {
      return errors.push({ line, message: "missing destination (only 410 rows may omit it)" });
    }
    if (!MATCH_TYPES.includes(match)) {
      return errors.push({ line, message: "match must be exact, wildcard or regex" });
    }
    out.push({
      source,
      destination: type === 410 ? "" : destination,
      type,
      note: get("note"),
      match: match as RedirectMatchType,
    });
  });
  return { rows: out, errors };
}
