/**
 * `PATCH /api/admin/integrations/verification` — save one search-engine verification entry, and
 * `DELETE` to remove one (CLAUDE.md §13B).
 *
 * A `meta` entry becomes a `<meta>` tag in every page's `<head>`; a `file` entry is served at
 * its public path by `/api/verify` through the proxy rewrite. File paths are restricted to the
 * names the engines actually hand out, so nothing arbitrary can be published at the site root.
 */
import { z } from "zod";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import {
  deleteVerificationTag,
  normalizeFilePath,
  setVerificationTag,
  validateFilePath,
  validateMetaContent,
  validateMetaName,
  VERIFICATION_PROVIDERS,
} from "@/lib/integrations/verification";

export const dynamic = "force-dynamic";

const schema = z.object({
  provider: z.enum(VERIFICATION_PROVIDERS),
  kind: z.enum(["meta", "file"]),
  metaName: z.string().trim().max(64).optional(),
  metaContent: z.string().trim().max(256).optional(),
  filePath: z.string().trim().max(120).optional(),
  fileContent: z.string().max(4000).optional(),
  isEnabled: z.union([z.boolean(), z.literal("on"), z.literal("off")]).optional(),
});

export const PATCH = adminRoute(
  async ({ data, audit }) => {
    const errors: Record<string, string[]> = {};
    if (data.kind === "meta") {
      const name = data.metaName ?? "";
      const content = data.metaContent ?? "";
      const nameError = validateMetaName(name);
      const contentError = validateMetaContent(content);
      if (nameError) errors.metaName = [nameError];
      if (contentError) errors.metaContent = [contentError];
    } else {
      const pathError = validateFilePath(data.filePath ?? "");
      if (pathError) errors.filePath = [pathError];
      if (!data.fileContent?.trim()) errors.fileContent = ["Paste the file's contents."];
    }
    if (Object.keys(errors).length) {
      throw new AdminRouteError("validation", "Check the fields", { errors });
    }

    const result = await setVerificationTag({
      provider: data.provider,
      kind: data.kind,
      metaName: data.metaName ?? null,
      metaContent: data.metaContent ?? null,
      filePath: data.filePath ? normalizeFilePath(data.filePath) : null,
      fileContent: data.fileContent ?? null,
      isEnabled:
        data.isEnabled === undefined ? true : data.isEnabled === true || data.isEnabled === "on",
    });
    await audit({
      action: "verification_tags.update",
      entityType: "verification_tags",
      entityId: result.after.id,
      before: result.before,
      after: result.after,
    });
    return { tag: result.after };
  },
  { role: "owner", schema },
);

export const DELETE = adminRoute(
  async ({ data, audit }) => {
    const removed = await deleteVerificationTag(data.id);
    if (!removed) throw new AdminRouteError("not_found");
    await audit({
      action: "verification_tags.delete",
      entityType: "verification_tags",
      entityId: removed.id,
      before: removed,
    });
    return { deleted: removed.id };
  },
  { role: "owner", schema: z.object({ id: z.string().uuid() }) },
);
