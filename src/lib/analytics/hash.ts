/**
 * Visitor identifier: HMAC-SHA256(dailySalt, ip + "|" + userAgent), where
 * dailySalt = HMAC-SHA256(IP_HASH_SALT, YYYY-MM-DD). The salt rotates every UTC day, so the
 * hash cannot be linked across days; the raw IP is never stored or logged (privacy policy,
 * "Cookieless analytics"). With `IP_HASH_SALT` unset a per-process random salt is used, which
 * still works but resets on every deploy — set it in production.
 */
import { createHmac, randomBytes } from "node:crypto";

const processSalt = randomBytes(32).toString("hex");

export function rootSalt(): string {
  const configured = process.env.IP_HASH_SALT?.trim();
  return configured && configured.length > 0 ? configured : processSalt;
}

/** `YYYY-MM-DD` in UTC. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dailySalt(date: Date, root: string = rootSalt()): string {
  return createHmac("sha256", root).update(utcDay(date)).digest("hex");
}

/** 32 hex characters — enough to count returning visits within a day, useless to reverse. */
export function visitorHash(ip: string, userAgent: string, date: Date, root?: string): string {
  const salt = dailySalt(date, root);
  return createHmac("sha256", salt).update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}
