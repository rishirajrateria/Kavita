/**
 * Integration-credential encryption (CLAUDE.md §13B: "credentials stored encrypted server-side;
 * never exposed to the client bundle"). A Meta access token or a Google service-account key must
 * round-trip exactly, must not be readable as plaintext in the stored envelope, must fail closed
 * under a wrong key, and must survive key rotation while an old envelope is still readable.
 */
import { randomBytes } from "node:crypto";
import { check, equal, excludes, includes } from "../seo-plumbing/_assert";
import { EncryptionError, loadKeyring } from "@/lib/crypto/birth-details";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  isSecretEncryptionConfigured,
} from "@/lib/crypto/secrets";

function keyring(env: Record<string, string | undefined>) {
  const ring = loadKeyring(env);
  if (!ring) throw new Error("test keyring failed to load");
  return ring;
}

const KEY_A = randomBytes(32).toString("base64");
const KEY_B = randomBytes(32).toString("base64");

export function run() {
  const ringA = keyring({ DATA_ENCRYPTION_KEY: KEY_A, DATA_ENCRYPTION_KEY_ID: "k1" });
  const ringB = keyring({ DATA_ENCRYPTION_KEY: KEY_B, DATA_ENCRYPTION_KEY_ID: "k1" });

  const token = "EAABsb1234567890|a-very-secret-meta-access-token";
  const envelope = encryptSecret(token, ringA);

  includes(envelope, "enc:v1:k1:", "secrets: the envelope carries its version and key id");
  excludes(envelope, token, "secrets: the plaintext is not in the envelope");
  excludes(envelope, "meta-access-token", "secrets: no fragment of the plaintext survives");
  check(isEncryptedSecret(envelope), "secrets: the envelope is recognised");
  check(!isEncryptedSecret("AW-123456789"), "secrets: a plain ID is not mistaken for an envelope");
  check(!isEncryptedSecret(null), "secrets: a non-string is not an envelope");

  equal(decryptSecret(envelope, ringA), token, "secrets: round-trip returns the exact token");

  // Two encryptions of the same value differ (fresh IV each time) but both decrypt.
  const again = encryptSecret(token, ringA);
  check(again !== envelope, "secrets: each encryption uses a fresh IV");
  equal(decryptSecret(again, ringA), token, "secrets: the second envelope decrypts too");

  // A multi-line JSON key (the Search Console credential) survives untouched.
  const serviceAccount = JSON.stringify({
    client_email: "kavita@project.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN\n-----END PRIVATE KEY-----\n",
  });
  equal(
    decryptSecret(encryptSecret(serviceAccount, ringA), ringA),
    serviceAccount,
    "secrets: a multi-line service-account key round-trips byte for byte",
  );

  // Fail closed.
  let wrongKey = false;
  try {
    decryptSecret(envelope, ringB);
  } catch (error) {
    wrongKey = error instanceof EncryptionError;
  }
  check(wrongKey, "secrets: the wrong key cannot decrypt");

  const [prefix, version, keyId, body = ""] = envelope.split(":");
  const tampered = `${prefix}:${version}:${keyId}:${Buffer.from(
    Buffer.from(body, "base64").map((b, i) => (i === 20 ? b ^ 0xff : b)),
  ).toString("base64")}`;
  let tamperDetected = false;
  try {
    decryptSecret(tampered, ringA);
  } catch (error) {
    tamperDetected = error instanceof EncryptionError;
  }
  check(tamperDetected, "secrets: a tampered ciphertext is rejected (GCM tag)");

  let unknownKey = false;
  try {
    decryptSecret(`enc:v1:k9:${body}`, ringA);
  } catch (error) {
    unknownKey = error instanceof EncryptionError;
  }
  check(unknownKey, "secrets: an unknown key id is rejected");

  // Rotation: a new current key, the old one still in the ring.
  const rotated = keyring({
    DATA_ENCRYPTION_KEYS: `k1:${KEY_A},k2:${KEY_B}`,
    DATA_ENCRYPTION_KEY_ID: "k2",
  });
  equal(decryptSecret(envelope, rotated), token, "secrets: an old envelope survives rotation");
  includes(encryptSecret(token, rotated), "enc:v1:k2:", "secrets: new writes use the current key");

  // Configuration probe, used by the admin to warn before a secret is refused.
  check(!isSecretEncryptionConfigured({}), "secrets: no key configured is reported honestly");
  check(
    isSecretEncryptionConfigured({ DATA_ENCRYPTION_KEY: KEY_A }),
    "secrets: a configured key is reported",
  );
}
