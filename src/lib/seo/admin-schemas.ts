/**
 * Zod schemas for the SEO-control mutations (`/api/admin/{page-seo,faqs,aeo,social,og-library}`;
 * Phase 6 P6-A). Client-safe. Bodies are flat so `ActionForm` (or a plain `<form>`) can post
 * them; multi-line fields arrive as textarea text and become arrays/objects here.
 */
import { z } from "zod";
import { OG_TYPES, ROBOTS_IMAGE_PREVIEWS, TWITTER_CARDS, type KeyFact } from "@/db/schema/seo";
import { formBoolean, lines, uuidSchema } from "@/lib/admin/manage-schemas";
import { OG_TEMPLATE_TYPES } from "./documents";
import { normalisePattern } from "./route-pattern";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** `""` → unset, `"on"|"true"` → true, `"off"|"false"` → false. */
const triState = z
  .union([z.boolean(), z.string(), z.undefined(), z.null()])
  .transform((v) => {
    if (v === true || v === "on" || v === "true") return true;
    if (v === false || v === "off" || v === "false") return false;
    return undefined;
  })
  .optional();

const optionalInt = (min: number, max: number) =>
  z
    .union([z.number(), z.string(), z.undefined(), z.null()])
    .transform((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)))
    .pipe(z.number().int().min(min).max(max).optional())
    .optional();

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal(""), z.undefined(), z.null()])
    .transform((v) => (v ? (v as T[number]) : null))
    .optional();

const HREFLANG_CODE = /^([a-z]{2}(-[A-Za-z]{2,4})?|x-default)$/;

/** Textarea of `code␠url` lines → `{ code: url }`; empty → null. */
export const hreflangLines = z
  .union([z.string(), z.record(z.string(), z.string()), z.undefined(), z.null()])
  .transform((v, ctx) => {
    if (!v) return null;
    if (typeof v === "object") return Object.keys(v).length ? v : null;
    const out: Record<string, string> = {};
    for (const raw of v.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const [code, url] = line.split(/[\s=,]+/, 2);
      if (!code || !url || !HREFLANG_CODE.test(code) || !/^https?:\/\//.test(url)) {
        ctx.addIssue({
          code: "custom",
          message: `Bad hreflang line: "${line}" (expected "en-IN https://…")`,
        });
        continue;
      }
      out[code] = url;
    }
    return Object.keys(out).length ? out : null;
  })
  .optional();

/** Textarea of `Label | Value` lines → KeyFact[]; empty → null. */
export const keyFactLines = z
  .union([
    z.string(),
    z.array(z.object({ label: z.string(), value: z.string() })),
    z.undefined(),
    z.null(),
  ])
  .transform((v): KeyFact[] | null => {
    if (!v) return null;
    if (Array.isArray(v)) return v.length ? v : null;
    const out: KeyFact[] = [];
    for (const raw of v.split(/\r?\n/)) {
      const [label, ...rest] = raw.split("|");
      const value = rest.join("|").trim();
      if (label?.trim() && value) out.push({ label: label.trim(), value });
    }
    return out.length ? out : null;
  })
  .optional();

export const routePatternSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine((v) => v.startsWith("/") || v === "*", "Must start with /")
  .transform(normalisePattern);

const jsonObject = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.undefined(), z.null()])
  .transform((v, ctx) => {
    if (!v) return null;
    if (typeof v === "object") return Object.keys(v).length ? v : null;
    try {
      const parsed: unknown = JSON.parse(v);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        ctx.addIssue({ code: "custom", message: "Must be a JSON object" });
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      ctx.addIssue({ code: "custom", message: "Not valid JSON" });
      return null;
    }
  })
  .optional();

export const pageSeoSchema = z.object({
  routePattern: routePatternSchema,
  title: optionalText(120),
  metaDescription: optionalText(320),
  h1Override: optionalText(200),
  canonicalUrl: optionalText(500),
  robotsIndex: triState,
  robotsFollow: triState,
  noarchive: formBoolean.default(false),
  nosnippet: formBoolean.default(false),
  maxSnippet: optionalInt(-1, 10_000),
  maxImagePreview: optionalEnum(ROBOTS_IMAGE_PREVIEWS),
  ogTitle: optionalText(200),
  ogDescription: optionalText(400),
  ogImageUrl: optionalText(1000),
  ogType: optionalEnum(OG_TYPES),
  ogText: optionalText(90),
  twitterCard: optionalEnum(TWITTER_CARDS),
  twitterTitle: optionalText(200),
  twitterDescription: optionalText(400),
  twitterImageUrl: optionalText(1000),
  keywordFocus: optionalText(120),
  customHeadHtml: optionalText(8000),
  hreflang: hreflangLines,
  structuredDataOverrides: jsonObject,
  isActive: formBoolean.default(true),
});
export type PageSeoInput = z.output<typeof pageSeoSchema>;

export const bulkAttachSchema = z.object({
  faqIds: z
    .union([z.array(uuidSchema), uuidSchema])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .pipe(z.array(uuidSchema).min(1).max(200)),
  routePattern: routePatternSchema,
  isPublished: formBoolean.default(true),
});

export const attachmentUpdateSchema = z.object({
  sortOrder: optionalInt(0, 9999),
  isPublished: triState,
  routePattern: routePatternSchema.optional(),
});

export const pageAnswerSchema = z.object({
  route: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((v) => v.startsWith("/"), "Must start with /"),
  h2Id: z.string().trim().min(1).max(120),
  answer: z.string().trim().max(2000).optional().default(""),
  keyFacts: keyFactLines,
});

export const llmsDocumentSchema = z.object({
  preamble: optionalText(2000),
  excludePaths: lines,
  extraPaths: lines,
  order: lines,
  includeCountryGeo: formBoolean.default(true),
});

export const forAiDocumentSchema = z.object({
  intro: optionalText(2000),
  extraFacts: keyFactLines,
  extraLimits: lines,
  extraBring: lines,
});

export const robotsBotSchema = z.object({
  agent: z.string().trim().min(1).max(80),
  allow: formBoolean.default(true),
  note: optionalText(500),
});

const templateFields = Object.fromEntries(
  OG_TEMPLATE_TYPES.flatMap((t) => [
    [`${t}_title`, optionalText(200)],
    [`${t}_description`, optionalText(400)],
  ]),
) as Record<
  `${(typeof OG_TEMPLATE_TYPES)[number]}_${"title" | "description"}`,
  ReturnType<typeof optionalText>
>;

export const ogTemplatesSchema = z.object(templateFields);

export const ogImageMetaSchema = z.object({
  label: z.string().trim().min(1).max(120),
  alt: z.string().trim().max(300).default(""),
});
