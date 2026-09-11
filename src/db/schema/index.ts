/**
 * Drizzle schema barrel. `drizzle-kit generate` reads this folder; the app imports from here.
 * Row types are `typeof table.$inferSelect` / `$inferInsert` — the committed generated types.
 */
export * from "./_shared";
export * from "./admin";
export * from "./analytics";
export * from "./booking";
export * from "./contact";
export * from "./flags";
export * from "./integrations";
export * from "./content";
export * from "./locations";
export * from "./redirects";
export * from "./seo";
export * from "./seo-health";
export * from "./services";
export * from "./site";
export * from "./types";
