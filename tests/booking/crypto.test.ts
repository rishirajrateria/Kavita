import { randomBytes } from "node:crypto";
import { check, equal } from "../seo-plumbing/_assert";
import {
  decryptBirthDetails,
  encryptBirthDetails,
  isEncryptionConfigured,
  loadKeyring,
  type BirthDetails,
} from "@/lib/crypto/birth-details";

export function run() {
  const k1 = randomBytes(32).toString("base64");
  const k2 = randomBytes(32).toString("base64");
  const details: BirthDetails = {
    date: "1990-04-12",
    time: "23:10",
    place: "Jaipur, Rajasthan, India",
    timeAccuracy: "approximate",
  };

  const single = loadKeyring({ DATA_ENCRYPTION_KEY: k1 });
  check(single !== null && single.currentId === "k1", "crypto: single key defaults to id k1");
  const { ciphertext, keyId } = encryptBirthDetails(details, single!);
  equal(keyId, "k1", "crypto: key id returned");
  check(ciphertext[0] === 0x01 && ciphertext.length > 29, "crypto: versioned envelope");
  const text = Buffer.from(ciphertext).toString("latin1");
  check(
    !text.includes("Jaipur") && !text.includes("1990"),
    "crypto: ciphertext hides the plaintext",
  );
  const round = decryptBirthDetails(ciphertext, keyId, single!);
  equal(JSON.stringify(round), JSON.stringify(details), "crypto: round-trip");

  const again = encryptBirthDetails(details, single!);
  check(
    Buffer.compare(Buffer.from(again.ciphertext), Buffer.from(ciphertext)) !== 0,
    "crypto: fresh IV every time",
  );

  const tampered = new Uint8Array(ciphertext);
  tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 0x01;
  let threw = false;
  try {
    decryptBirthDetails(tampered, keyId, single!);
  } catch (e) {
    threw = e instanceof Error && !e.message.includes("Jaipur");
  }
  check(threw, "crypto: tampering fails with a generic error");

  const rotated = loadKeyring({
    DATA_ENCRYPTION_KEYS: `k1:${k1},k2:${k2}`,
    DATA_ENCRYPTION_KEY_ID: "k2",
  });
  check(rotated?.currentId === "k2", "crypto: rotation ring picks the named current key");
  equal(
    decryptBirthDetails(ciphertext, "k1", rotated!).place,
    details.place,
    "crypto: old key still decrypts",
  );
  const fresh = encryptBirthDetails(details, rotated!);
  equal(fresh.keyId, "k2", "crypto: new writes use k2");
  threw = false;
  try {
    decryptBirthDetails(fresh.ciphertext, "k1", rotated!);
  } catch {
    threw = true;
  }
  check(threw, "crypto: wrong key id (AAD) is rejected");

  check(loadKeyring({}) === null, "crypto: no key → null keyring");
  check(!isEncryptionConfigured({}), "crypto: not configured");
  check(
    isEncryptionConfigured({ BIRTH_DETAILS_ENCRYPTION_KEY: k1 }),
    "crypto: legacy Phase 1 name honoured",
  );
  threw = false;
  try {
    loadKeyring({ DATA_ENCRYPTION_KEY: "short" });
  } catch {
    threw = true;
  }
  check(threw, "crypto: a key that is not 32 bytes is refused");
}
