/**
 * Wire format of `POST /api/t` (what `public/t.js` sends). Strict and small: anything that
 * fails here is silently dropped by the route. No field can carry personal data by design —
 * paths are sanitised in `paths.ts`, form events carry field names only, click text is page
 * content capped at 60 characters.
 */
import { z } from "zod";
import { ANALYTICS_EVENT_NAMES, BEHAVIOUR_EVENT_NAMES } from "@/db/schema/analytics";

export const MAX_BATCH = 20;

const key = z.string().regex(/^[a-f0-9]{8,32}$/);
const path = z.string().min(1).max(512);
const title = z.string().max(200).optional();
const ts = z.number().int().nonnegative();
const scrollMark = z.union([
  z.literal(0),
  z.literal(25),
  z.literal(50),
  z.literal(75),
  z.literal(90),
  z.literal(100),
]);

const propValue = z.union([z.string().max(200), z.number().finite(), z.boolean(), z.null()]);

export const EVENT_NAMES = [...ANALYTICS_EVENT_NAMES, ...BEHAVIOUR_EVENT_NAMES] as const;

const pageviewEvent = z.object({
  t: z.literal("pv"),
  k: key,
  p: path,
  r: z.string().max(1024).optional(),
  ti: title,
  u: z
    .object({
      s: z.string().max(120).optional(),
      m: z.string().max(120).optional(),
      c: z.string().max(120).optional(),
      n: z.string().max(120).optional(),
      t: z.string().max(120).optional(),
    })
    .optional(),
  ts,
});

const pageEndEvent = z.object({
  t: z.literal("pe"),
  k: key,
  p: path,
  tp: z
    .number()
    .int()
    .nonnegative()
    .max(24 * 60 * 60 * 1000),
  sd: scrollMark,
  ti: title,
  ts,
});

const scrollEvent = z.object({
  t: z.literal("sd"),
  k: key,
  p: path,
  d: scrollMark,
  ts,
});

const customEvent = z.object({
  t: z.literal("e"),
  n: z.enum(EVENT_NAMES),
  p: path,
  pr: z.record(z.string().max(40), propValue).default({}),
  id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{8,64}$/)
    .optional(),
  ts,
});

export const trackerEventSchema = z.discriminatedUnion("t", [
  pageviewEvent,
  pageEndEvent,
  scrollEvent,
  customEvent,
]);

export const batchSchema = z.object({
  v: z.literal(1),
  sid: key,
  ns: z.boolean().optional(),
  ref: z.string().max(1024).optional(),
  sw: z.number().int().min(0).max(20000).optional(),
  sh: z.number().int().min(0).max(20000).optional(),
  vw: z.number().int().min(0).max(20000).optional(),
  vh: z.number().int().min(0).max(20000).optional(),
  conn: z.string().max(16).optional(),
  ev: z.array(trackerEventSchema).min(1).max(MAX_BATCH),
});

export type TrackerBatch = z.infer<typeof batchSchema>;
export type TrackerEvent = z.infer<typeof trackerEventSchema>;

/** Parse a raw request body (text) into a batch, or `null` when it is not one. */
export function parseBatch(raw: string): TrackerBatch | null {
  if (raw.length === 0 || raw.length > 64 * 1024) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = batchSchema.safeParse(json);
  return result.success ? result.data : null;
}
