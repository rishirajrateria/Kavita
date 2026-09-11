/**
 * `GET /api/admin/og-library` lists the image library; `POST` (multipart: `file`, `label`,
 * `alt`) uploads to the public `og-library` bucket (editor+). Answers 503 `storage_unavailable`
 * when Supabase Storage is not configured.
 */
import { getDb } from "@/db";
import { AdminRouteError, adminRoute, jsonError } from "@/lib/admin/mutations";
import { ogImageMetaSchema } from "@/lib/seo/admin-schemas";
import { listOgImages, OG_IMAGE_MAX_BYTES, uploadOgImage } from "@/lib/seo/og-library";
import { isStorageConfigured } from "@/lib/storage/supabase";

export const dynamic = "force-dynamic";

export const GET = adminRoute(
  async () => ({ images: await listOgImages(getDb()), storage: isStorageConfigured() }),
  { role: "viewer", requireDatabase: false },
);

export const POST = adminRoute(
  async ({ request, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AdminRouteError("bad_request", "Expected multipart form data");
    }
    const file = form.get("file");
    if (!(file instanceof File))
      throw new AdminRouteError("validation", "Choose an image file", {
        errors: { file: ["required"] },
      });
    if (file.size > OG_IMAGE_MAX_BYTES) {
      throw new AdminRouteError("validation", "Image is larger than 4 MB", {
        errors: { file: ["too large"] },
      });
    }
    const meta = ogImageMetaSchema.safeParse({
      label: form.get("label") ?? file.name,
      alt: form.get("alt") ?? "",
    });
    if (!meta.success) throw new AdminRouteError("validation", "Label is required");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadOgImage(db, { bytes, ...meta.data });
    if (!result.ok) {
      if (result.reason === "storage_unavailable") {
        return jsonError("not_connected", {
          message:
            "Supabase Storage is not configured (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).",
        });
      }
      throw new AdminRouteError("validation", result.message ?? result.reason, {
        errors: { file: [result.reason] },
      });
    }
    await audit({
      action: "og_images.upload",
      entityType: "og_images",
      entityId: result.image.id,
      after: result.image,
    });
    return { image: result.image };
  },
  { role: "editor" },
);
