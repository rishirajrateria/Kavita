/**
 * The hand-built Google service-account JWT (Phase 6, P6-B) — `google-auth-library` is not a
 * dependency, so the assertion is signed with `node:crypto`. Shape, claims and signature are
 * verified here against a throw-away RSA key; no network.
 */
import { createVerify, generateKeyPairSync } from "node:crypto";
import { check, equal } from "../seo-plumbing/_assert";
import {
  GOOGLE_TOKEN_URL,
  SEARCH_CONSOLE_SCOPE,
  buildClaims,
  decodeJwt,
  parseServiceAccountKey,
  signServiceAccountJwt,
} from "@/lib/search-console/jwt";

export function run(): void {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  // --- key parsing ---
  equal(parseServiceAccountKey(null), null, "missing key JSON rejected");
  equal(parseServiceAccountKey("not json"), null, "malformed key JSON rejected");
  equal(
    parseServiceAccountKey(JSON.stringify({ client_email: "a@b.iam.gserviceaccount.com" })),
    null,
    "key without a private key rejected",
  );
  const key = parseServiceAccountKey(
    JSON.stringify({
      type: "service_account",
      client_email: "kavita@project.iam.gserviceaccount.com",
      private_key: pem,
    }),
  );
  check(key !== null, "a well-formed service-account key parses");
  if (!key) return;
  equal(key.client_email, "kavita@project.iam.gserviceaccount.com", "client_email kept");

  // --- claims ---
  const now = new Date("2026-09-11T00:00:00Z");
  const claims = buildClaims(key, SEARCH_CONSOLE_SCOPE, now);
  equal(claims.iss, key.client_email, "iss is the service account");
  equal(claims.aud, GOOGLE_TOKEN_URL, "aud defaults to the OAuth2 token endpoint");
  equal(claims.scope, SEARCH_CONSOLE_SCOPE, "read-only Search Console scope requested");
  equal(claims.exp - claims.iat, 3600, "assertion lives one hour (Google's maximum)");
  equal(claims.iat, Math.floor(now.getTime() / 1000), "iat is in seconds, not milliseconds");
  equal(
    buildClaims({ client_email: "x@y", token_uri: "https://example.test/token" }, "s", now).aud,
    "https://example.test/token",
    "token_uri from the key wins",
  );

  // --- signature ---
  const token = signServiceAccountJwt({ ...key, private_key: pem }, SEARCH_CONSOLE_SCOPE, now);
  const parts = token.split(".");
  equal(parts.length, 3, "JWT has three parts");
  check(!/[+/=]/.test(token), "JWT is base64url, not base64");
  const decoded = decodeJwt(token);
  equal(decoded.header.alg, "RS256", "RS256 header (Google requires it)");
  equal(decoded.header.typ, "JWT", "typ header present");
  equal(decoded.payload.iss, key.client_email, "payload carries the issuer");
  equal(decoded.payload.exp - decoded.payload.iat, 3600, "payload expiry matches the claims");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  check(
    verifier.verify(publicKey, Buffer.from(parts[2] ?? "", "base64url")),
    "signature verifies against the public key",
  );

  // A tampered payload must not verify — this is what stops a swapped scope reaching Google.
  const tampered = `${parts[0]}.${Buffer.from(
    JSON.stringify({ ...decoded.payload, scope: "https://www.googleapis.com/auth/webmasters" }),
  ).toString("base64url")}.${parts[2]}`;
  const tamperVerifier = createVerify("RSA-SHA256");
  tamperVerifier.update(tampered.split(".").slice(0, 2).join("."));
  tamperVerifier.end();
  check(
    !tamperVerifier.verify(publicKey, Buffer.from(parts[2] ?? "", "base64url")),
    "a tampered payload fails verification",
  );
}
