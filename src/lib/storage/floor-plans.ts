/**
 * Floor-plan upload rules: ≤ 10 MB, PDF/PNG/JPEG/WebP only, decided by magic bytes rather than
 * the declared type or extension. Paths are `floor-plans/YYYY/MM/<uuid>.<ext>` in the private
 * `floor-plans` bucket; the file name the client used is never stored.
 */
import { randomUUID } from "node:crypto";

export const FLOOR_PLAN_BUCKET = "floor-plans";
export const FLOOR_PLAN_MAX_BYTES = 10 * 1024 * 1024;

export type FloorPlanKind = { contentType: string; extension: "pdf" | "png" | "jpg" | "webp" };

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  if (bytes.length < offset + prefix.length) return false;
  return prefix.every((b, i) => bytes[offset + i] === b);
}

/** The real type from the first bytes, or `null` for anything else (including SVG/HTML/ZIP). */
export function sniffFloorPlan(bytes: Uint8Array): FloorPlanKind | null {
  if (startsWith(bytes, ascii("%PDF-")))
    return { contentType: "application/pdf", extension: "pdf" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", extension: "png" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { contentType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

export function floorPlanPath(kind: FloorPlanKind, now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${FLOOR_PLAN_BUCKET}/${y}/${m}/${randomUUID()}.${kind.extension}`;
}
