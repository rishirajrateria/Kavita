/**
 * Google service-account access tokens without `google-auth-library` (not installed): a
 * self-signed RS256 JWT built with `node:crypto`, exchanged at the OAuth2 token endpoint.
 * Used by the Search Console test-connection; P6-B's search-console client may reuse it.
 */
import { createSign } from "node:crypto";

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Parse the JSON key file; throws a plain error (never echoing the key) when malformed. */
export function parseServiceAccount(json: string): ServiceAccountKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Service-account JSON is not valid JSON");
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  if (typeof p.client_email !== "string" || typeof p.private_key !== "string") {
    throw new Error("Service-account JSON is missing client_email or private_key");
  }
  return {
    client_email: p.client_email,
    private_key: p.private_key,
    token_uri: typeof p.token_uri === "string" ? p.token_uri : undefined,
  };
}

/** RS256-signed JWT assertion for the given scopes, valid for one hour. */
export function signServiceAccountJwt(
  key: ServiceAccountKey,
  scopes: readonly string[],
  now: number = Date.now(),
): string {
  const iat = Math.floor(now / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: scopes.join(" "),
      aud: key.token_uri ?? GOOGLE_TOKEN_URL,
      iat,
      exp: iat + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(key.private_key).toString("base64url");
  return `${header}.${claims}.${signature}`;
}

/** Exchange the assertion for a bearer token. */
export async function getGoogleAccessToken(
  key: ServiceAccountKey,
  scopes: readonly string[],
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const assertion = signServiceAccountJwt(key, scopes);
  const response = await fetchImpl(key.token_uri ?? GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || typeof json.access_token !== "string") {
    const detail =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.error === "string"
          ? json.error
          : `HTTP ${response.status}`;
    throw new Error(`Google token exchange failed: ${detail}`);
  }
  return json.access_token;
}
