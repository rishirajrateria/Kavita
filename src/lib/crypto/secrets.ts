/**
 * Generic AES-256-GCM string secrets (Phase 6): integration credentials — Meta access tokens,
 * Bing API keys, Google service-account JSON — stored inside `integrations.config`. Reuses the
 * keyring of `./birth-details` (DATA_ENCRYPTION_KEY / DATA_ENCRYPTION_KEYS), so one env var
 * protects every secret and key rotation covers both.
 *
 * Envelope (a plain string, safe inside JSONB): `enc:v1:<keyId>:<base64(iv|tag|ciphertext)>`,
 * with `secret:<keyId>` as additional authenticated data. Nothing here logs, throws with, or
 * returns plaintext in an error message.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { EncryptionError, loadKeyring, type Keyring } from "./birth-details";

export { EncryptionError } from "./birth-details";

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cached: Keyring | null | undefined;

function keyring(): Keyring {
  if (cached === undefined) cached = loadKeyring();
  if (!cached) throw new EncryptionError("DATA_ENCRYPTION_KEY is not set");
  return cached;
}

/** True when a key is configured, so secrets can be saved. */
export function isSecretEncryptionConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    return loadKeyring(env) !== null;
  } catch {
    return false;
  }
}

/** Recognise a stored envelope (never mistake a plaintext ID for one). */
export function isEncryptedSecret(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PREFIX) && value.split(":").length === 4;
}

/** Encrypt with the current key. */
export function encryptSecret(plain: string, ring: Keyring = keyring()): string {
  const key = ring.keys.get(ring.currentId);
  if (!key) throw new EncryptionError("Current encryption key is missing");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`secret:${ring.currentId}`));
  const body = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${ring.currentId}:${Buffer.concat([iv, tag, body]).toString("base64")}`;
}

/** Decrypt an envelope; tampering, a wrong key or a malformed value throws a generic error. */
export function decryptSecret(value: string, ring: Keyring = keyring()): string {
  if (!isEncryptedSecret(value)) throw new EncryptionError("Value is not an encrypted secret");
  const [, , keyId = "", b64 = ""] = value.split(":");
  const key = ring.keys.get(keyId);
  if (!key) throw new EncryptionError(`Unknown encryption key id "${keyId}"`);
  const buf = Buffer.from(b64, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES) throw new EncryptionError("Ciphertext is malformed");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, buf.subarray(0, IV_BYTES));
    decipher.setAAD(Buffer.from(`secret:${keyId}`));
    decipher.setAuthTag(buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    return Buffer.concat([
      decipher.update(buf.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new EncryptionError("Secret could not be decrypted");
  }
}

/** Tests and rotation scripts may reset the cached keyring after changing the env. */
export function resetSecretsKeyringCache(): void {
  cached = undefined;
}
