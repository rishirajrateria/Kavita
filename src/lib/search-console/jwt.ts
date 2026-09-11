/**
 * Self-signed service-account JWT for Google APIs (Phase 6, P6-B). `google-auth-library` is
 * not installed, so the assertion is built by hand with `node:crypto`: RS256 over the
 * service-account private key, exchanged at `https://oauth2.googleapis.com/token` for a
 * bearer token (`google.ts`). Pure apart from the signature, unit-tested for shape.
 */
import { createSign } from "node:crypto";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  /** Optional in the JSON key; defaults to the OAuth2 token endpoint. */
  token_uri?: string;
}

export interface JwtClaims {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
  [extra: string]: string | number | undefined;
}

export function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Parse the pasted JSON key; `null` when it is not a usable service-account key. */
export function parseServiceAccountKey(json: string | null | undefined): ServiceAccountKey | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<ServiceAccountKey> & { type?: string };
    if (
      typeof parsed.client_email !== "string" ||
      typeof parsed.private_key !== "string" ||
      !parsed.private_key.includes("PRIVATE KEY")
    ) {
      return null;
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
      token_uri: typeof parsed.token_uri === "string" ? parsed.token_uri : undefined,
    };
  } catch {
    return null;
  }
}

/** Claims for a one-hour assertion (Google's maximum) starting at `now`. */
export function buildClaims(
  key: Pick<ServiceAccountKey, "client_email" | "token_uri">,
  scope: string,
  now: Date = new Date(),
): JwtClaims {
  const iat = Math.floor(now.getTime() / 1000);
  return {
    iss: key.client_email,
    scope,
    aud: key.token_uri ?? GOOGLE_TOKEN_URL,
    iat,
    exp: iat + 3600,
  };
}

/** `header.payload.signature` — RS256, as Google's OAuth2 service-account flow requires. */
export function signServiceAccountJwt(
  key: ServiceAccountKey,
  scope: string = SEARCH_CONSOLE_SCOPE,
  now: Date = new Date(),
): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(buildClaims(key, scope, now)));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(key.private_key).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

/** Decode (without verifying) for tests and diagnostics. */
export function decodeJwt(token: string): { header: Record<string, unknown>; payload: JwtClaims } {
  const [h, p] = token.split(".");
  if (!h || !p) throw new Error("malformed JWT");
  return {
    header: JSON.parse(Buffer.from(h, "base64url").toString("utf8")) as Record<string, unknown>,
    payload: JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as JwtClaims,
  };
}
