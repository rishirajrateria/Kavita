/**
 * OG image library (Phase 6 P6-A): rows in `og_images`, bytes in the public Supabase Storage
 * bucket `og-library`. Uploads are sniffed by magic bytes (PNG/JPEG/WebP only, ≤ 4 MB) and
 * their pixel size read from the header so the admin sees which images fit 1200×630. When
 * Storage is not configured the library lists but cannot upload; the UI says so.
 */
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { BookingDb as Db } from "@/lib/booking/db";
import { OG_LIBRARY_BUCKET, ogImages, type OgImage } from "@/db/schema/seo";
import { getServiceClient, isStorageConfigured } from "@/lib/storage/supabase";

export const OG_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const OG_RECOMMENDED = { width: 1200, height: 630 } as const;

export type OgImageKind = { contentType: string; extension: "png" | "jpg" | "webp" };

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  if (bytes.length < offset + prefix.length) return false;
  return prefix.every((b, i) => bytes[offset + i] === b);
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

export function sniffOgImage(bytes: Uint8Array): OgImageKind | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", extension: "png" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { contentType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

/** Pixel size from the header (PNG IHDR, JPEG SOF, WebP VP8/VP8L/VP8X); `null` if unreadable. */
export function readImageSize(
  bytes: Uint8Array,
  kind: OgImageKind,
): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  try {
    if (kind.extension === "png" && bytes.length >= 24) {
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    if (kind.extension === "jpg") {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) return null;
        const marker = bytes[i + 1] ?? 0;
        const len = view.getUint16(i + 2);
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
        }
        i += 2 + len;
      }
      return null;
    }
    if (kind.extension === "webp" && bytes.length >= 30) {
      const chunk = String.fromCharCode(...bytes.slice(12, 16));
      if (chunk === "VP8X") {
        return {
          width: 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16)),
          height: 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16)),
        };
      }
      if (chunk === "VP8 ") {
        return {
          width: view.getUint16(26, true) & 0x3fff,
          height: view.getUint16(28, true) & 0x3fff,
        };
      }
      if (chunk === "VP8L") {
        const b = view.getUint32(21, true);
        return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function ogImagePath(kind: OgImageKind, now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}/${m}/${randomUUID()}.${kind.extension}`;
}

export async function listOgImages(db: Db | null): Promise<OgImage[]> {
  if (!db) return [];
  return db.select().from(ogImages).orderBy(desc(ogImages.createdAt));
}

export async function getOgImage(db: Db, id: string): Promise<OgImage | null> {
  return (await db.select().from(ogImages).where(eq(ogImages.id, id)))[0] ?? null;
}

export type UploadResult =
  | { ok: true; image: OgImage }
  | {
      ok: false;
      reason: "storage_unavailable" | "unsupported_type" | "too_large" | "upload_failed";
      message?: string;
    };

/** Upload bytes to the public bucket and record the row. */
export async function uploadOgImage(
  db: Db,
  input: { bytes: Uint8Array; label: string; alt: string },
): Promise<UploadResult> {
  if (!isStorageConfigured()) return { ok: false, reason: "storage_unavailable" };
  if (input.bytes.byteLength > OG_IMAGE_MAX_BYTES) return { ok: false, reason: "too_large" };
  const kind = sniffOgImage(input.bytes);
  if (!kind) return { ok: false, reason: "unsupported_type" };
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, reason: "storage_unavailable" };
  const path = ogImagePath(kind);
  const { error } = await supabase.storage
    .from(OG_LIBRARY_BUCKET)
    .upload(path, input.bytes, { contentType: kind.contentType, upsert: false });
  if (error) return { ok: false, reason: "upload_failed", message: error.message };
  const { data } = supabase.storage.from(OG_LIBRARY_BUCKET).getPublicUrl(path);
  const size = readImageSize(input.bytes, kind);
  const [image] = await db
    .insert(ogImages)
    .values({
      storagePath: path,
      publicUrl: data.publicUrl,
      label: input.label,
      alt: input.alt,
      width: size?.width ?? null,
      height: size?.height ?? null,
      bytes: input.bytes.byteLength,
      contentType: kind.contentType,
    })
    .returning();
  return image ? { ok: true, image } : { ok: false, reason: "upload_failed" };
}

/** Delete the row and best-effort remove the object. */
export async function deleteOgImage(db: Db, id: string): Promise<OgImage | null> {
  const [row] = await db.delete(ogImages).where(eq(ogImages.id, id)).returning();
  if (!row) return null;
  const supabase = getServiceClient();
  if (supabase) await supabase.storage.from(OG_LIBRARY_BUCKET).remove([row.storagePath]);
  return row;
}
