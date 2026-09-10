/**
 * Validated environment access. Server-side only — never import from a client component.
 *
 * Everything is optional so `pnpm build` and SSG succeed with no database configured: the data
 * layer falls back to the seed content in `src/content/seed` when `SUPABASE_DB_URL` is unset.
 */
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Direct Postgres connection string (Supabase → Connect → Transaction pooler). */
  SUPABASE_DB_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  /** 32-byte base64 key for encrypting client birth details at rest. */
  BIRTH_DETAILS_ENCRYPTION_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PAYMENTS_ENABLED: z.preprocess(emptyToUndefined, z.enum(["true", "false"]).default("false")),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parse `process.env` once. Throws a readable error if a value is present but malformed. */
export function getEnv(): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  cached = result.data;
  return cached;
}
