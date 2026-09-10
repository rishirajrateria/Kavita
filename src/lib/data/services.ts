/**
 * Services. Server-only; DB when configured, seed content otherwise.
 */
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { SEED_NS, hydrate, servicesSeed } from "@/content/seed";
import type { Service } from "./types";

/** Active services, sorted by `sortOrder`. */
export const getServices = cache(async (): Promise<Service[]> => {
  const db = getDb();
  if (db) {
    return db.query.services.findMany({
      where: eq(services.isActive, true),
      orderBy: [asc(services.sortOrder)],
    });
  }
  return servicesSeed
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => hydrate<Service>(SEED_NS.services, s.slug, s));
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const db = getDb();
  if (db) {
    const row = await db.query.services.findFirst({
      where: and(eq(services.slug, slug), eq(services.isActive, true)),
    });
    return row ?? null;
  }
  const seed = servicesSeed.find((s) => s.slug === slug && s.isActive);
  return seed ? hydrate<Service>(SEED_NS.services, seed.slug, seed) : null;
});
