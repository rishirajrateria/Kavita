/**
 * AES-256-GCM encryption for client birth details (CLAUDE.md §10: encrypted at rest, never
 * logged, never sent to the browser). Keys come from the environment:
 *
 *   DATA_ENCRYPTION_KEY       base64 of 32 random bytes (`openssl rand -base64 32`) — current key
 *   DATA_ENCRYPTION_KEY_ID    label stored in `clients.birth_details_key_id` (default `k1`)
 *   DATA_ENCRYPTION_KEYS      optional rotation ring: `k1:<base64>,k2:<base64>`; the id named
 *                             by DATA_ENCRYPTION_KEY_ID (or the last entry) encrypts, all decrypt
 *   BIRTH_DETAILS_ENCRYPTION_KEY  legacy name from Phase 1, honoured as key `k1` if set
 *
 * Ciphertext layout: `0x01 | 12-byte IV | 16-byte auth tag | AES-GCM ciphertext`, with the key id
 * as additional authenticated data so a ciphertext cannot be re-labelled to another key.
 * No function here logs, throws or returns plaintext in an error message.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { BIRTH_TIME_ACCURACY, type BirthDetails, type BirthTimeAccuracy } from "./types";

export { BIRTH_TIME_ACCURACY, type BirthDetails, type BirthTimeAccuracy } from "./types";

export interface Keyring {
  currentId: string;
  keys: ReadonlyMap<string, Buffer>;
}

export class EncryptionError extends Error {
  override name = "EncryptionError";
}

const VERSION = 0x01;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const DEFAULT_KEY_ID = "k1";
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

function decodeKey(id: string, base64: string): Buffer {
  const key = Buffer.from(base64.trim(), "base64");
  if (key.length !== KEY_BYTES) {
    throw new EncryptionError(`Encryption key "${id}" must decode to 32 bytes`);
  }
  return key;
}

/** Parse the keyring from the environment; `null` when no key is configured. */
export function loadKeyring(env: Record<string, string | undefined> = process.env): Keyring | null {
  const keys = new Map<string, Buffer>();
  const ring = env.DATA_ENCRYPTION_KEYS?.trim();
  if (ring) {
    for (const entry of ring.split(",")) {
      const [id, value] = entry.split(":").map((s) => s.trim());
      if (!id || !value || !KEY_ID_PATTERN.test(id)) {
        throw new EncryptionError("DATA_ENCRYPTION_KEYS must be a comma list of id:base64");
      }
      keys.set(id, decodeKey(id, value));
    }
  }
  const explicitId = env.DATA_ENCRYPTION_KEY_ID?.trim();
  if (explicitId && !KEY_ID_PATTERN.test(explicitId)) {
    throw new EncryptionError("DATA_ENCRYPTION_KEY_ID may contain only letters, digits, _ and -");
  }
  const single = env.DATA_ENCRYPTION_KEY?.trim() || env.BIRTH_DETAILS_ENCRYPTION_KEY?.trim();
  if (single) {
    const id = explicitId ?? DEFAULT_KEY_ID;
    keys.set(id, decodeKey(id, single));
  }
  if (keys.size === 0) return null;
  const currentId = explicitId ?? [...keys.keys()].at(-1) ?? DEFAULT_KEY_ID;
  if (!keys.has(currentId)) {
    throw new EncryptionError(`DATA_ENCRYPTION_KEY_ID "${currentId}" has no matching key`);
  }
  return { currentId, keys };
}

let cached: Keyring | null | undefined;

function keyring(): Keyring {
  if (cached === undefined) cached = loadKeyring();
  if (!cached) throw new EncryptionError("DATA_ENCRYPTION_KEY is not set");
  return cached;
}

export function isEncryptionConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  try {
    return loadKeyring(env) !== null;
  } catch {
    return false;
  }
}

/** Encrypt with the current key. Returns the ciphertext and the id to store beside it. */
export function encryptBirthDetails(
  details: BirthDetails,
  ring: Keyring = keyring(),
): { ciphertext: Uint8Array; keyId: string } {
  const key = ring.keys.get(ring.currentId);
  if (!key) throw new EncryptionError("Current encryption key is missing");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`birth-details:${ring.currentId}`));
  const plaintext = Buffer.from(JSON.stringify(details), "utf8");
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([Buffer.from([VERSION]), iv, tag, body]);
  return { ciphertext: new Uint8Array(out), keyId: ring.currentId };
}

/** Decrypt with the key named by `keyId`; any tampering or wrong key throws a generic error. */
export function decryptBirthDetails(
  ciphertext: Uint8Array,
  keyId: string,
  ring: Keyring = keyring(),
): BirthDetails {
  const key = ring.keys.get(keyId);
  if (!key) throw new EncryptionError(`Unknown encryption key id "${keyId}"`);
  const buf = Buffer.from(ciphertext);
  if (buf.length < 1 + IV_BYTES + TAG_BYTES || buf[0] !== VERSION) {
    throw new EncryptionError("Ciphertext is malformed");
  }
  const iv = buf.subarray(1, 1 + IV_BYTES);
  const tag = buf.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
  const body = buf.subarray(1 + IV_BYTES + TAG_BYTES);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(`birth-details:${keyId}`));
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    const parsed: unknown = JSON.parse(plain);
    if (!parsed || typeof parsed !== "object") throw new Error("shape");
    const p = parsed as Record<string, unknown>;
    if (typeof p.date !== "string" || typeof p.place !== "string") throw new Error("shape");
    return {
      date: p.date,
      time: typeof p.time === "string" ? p.time : null,
      place: p.place,
      timeAccuracy: (BIRTH_TIME_ACCURACY as readonly string[]).includes(String(p.timeAccuracy))
        ? (p.timeAccuracy as BirthTimeAccuracy)
        : "unknown",
    };
  } catch {
    // Deliberately generic: never include key material or plaintext fragments.
    throw new EncryptionError("Birth details could not be decrypted");
  }
}

/** Tests and key rotation scripts may reset the cached keyring after changing the env. */
export function resetKeyringCache(): void {
  cached = undefined;
}
