/**
 * `PATCH /api/admin/sitemaps` (editor+). Two shapes, both flat so a plain form can post them:
 *   { section, included }                                  — switch a whole sitemap on/off
 *   { section, path, pageIncluded?, priority?, changeFrequency?, clear? } — one page's override
 */
import { z } from "zod";
import { getDb } from "@/db";
import { formBoolean } from "@/lib/admin/manage-schemas";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { normalisePathname } from "@/lib/redirects/matchers";
import {
  SITEMAP_SECTIONS,
  saveSitemapSection,
  setPageOverride,
} from "@/lib/redirects/sitemap-config";

export const dynamic = "force-dynamic";

const sections = SITEMAP_SECTIONS.map((s) => s.key);
const CHANGEFREQ = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"] as const;

const schema = z.object({
  section: z.enum(sections as [string, ...string[]]),
  included: formBoolean.optional(),
  path: z.string().trim().max(512).optional(),
  pageIncluded: formBoolean.optional(),
  priority: z
    .union([z.coerce.number().min(0).max(1), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  changeFrequency: z
    .union([z.enum(CHANGEFREQ), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  clear: formBoolean.optional(),
});

export const PATCH = adminRoute(
  async ({ data, audit }) => {
    const db = getDb();
    if (!db) throw new AdminRouteError("not_connected");
    const section = data.section as (typeof sections)[number];
    if (data.path) {
      const path = normalisePathname(data.path);
      const override = data.clear
        ? null
        : {
            ...(data.pageIncluded === false ? { included: false } : {}),
            ...(data.priority !== undefined ? { priority: data.priority } : {}),
            ...(data.changeFrequency ? { changeFrequency: data.changeFrequency } : {}),
          };
      const next = await setPageOverride(
        db,
        section,
        path,
        override && Object.keys(override).length ? override : null,
      );
      await audit({
        action: "sitemap_config.page",
        entityType: "sitemap_config",
        entityId: section,
        after: { path, override },
      });
      return { section, config: next };
    }
    if (data.included === undefined) throw new AdminRouteError("bad_request", "Nothing to change");
    const next = await saveSitemapSection(db, section, { included: data.included });
    await audit({
      action: "sitemap_config.section",
      entityType: "sitemap_config",
      entityId: section,
      after: { included: data.included },
    });
    return { section, config: next };
  },
  { role: "editor", schema },
);
