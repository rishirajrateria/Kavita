/**
 * Server-only Supabase client with the service role, for private Storage buckets. Created lazily;
 * `null` when the project URL or service key is missing so every caller can answer 503 cleanly.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

export function isStorageConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getServiceClient(): SupabaseClient | null {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  client ??= createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Upload bytes to a private bucket; throws on failure with the storage error message only. */
export async function uploadPrivateObject(input: {
  bucket: string;
  path: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");
  const { error } = await supabase.storage
    .from(input.bucket)
    .upload(input.path, input.bytes, { contentType: input.contentType, upsert: false });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
}
