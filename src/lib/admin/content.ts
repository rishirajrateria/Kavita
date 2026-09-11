/**
 * Content management (Phase 5 P5-C): testimonials, services, FAQs and location research.
 * Articles and glossary terms stay repo-managed in v1 (MDX / TS) and are listed read-only.
 * Every write takes an explicit `db` and returns `{ before, after }` for the audit log; with no
 * database the seed content is listed read-only so the admin can be reviewed offline.
 */
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import type { z } from "zod";
import {
  faqs,
  locations,
  services,
  testimonials,
  type Faq,
  type Location,
  type Service,
  type Testimonial,
} from "@/db/schema";
import { deriveResearchStatus, type LocationRecord } from "@/content/locations/schema";
import { SEED_NS, faqsSeed, hydrate, servicesSeed } from "@/content/seed";
import { faqSeedKey } from "@/lib/data/faqs";
import { getAllLocations } from "@/lib/data/locations";
import type { BookingDb } from "@/lib/booking/db";
import type {
  faqSchema,
  faqUpdateSchema,
  locationUpdateSchema,
  serviceUpdateSchema,
  testimonialUpdateSchema,
} from "./manage-schemas";

export type ManageDb = BookingDb;

type Diff<T> = { before: T | null; after: T | null };

function definedOnly<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// --- testimonials -----------------------------------------------------------------------------

export type TestimonialFilter = "all" | "submissions" | "published" | "unpublished";

/** Submissions = website-form rows awaiting a decision (not yet published). */
export async function listTestimonials(
  db: ManageDb | null,
  filter: TestimonialFilter = "all",
): Promise<Testimonial[]> {
  if (!db) return [];
  const where: SQL[] = [];
  if (filter === "submissions")
    where.push(eq(testimonials.source, "website_form"), eq(testimonials.isPublished, false));
  if (filter === "published") where.push(eq(testimonials.isPublished, true));
  if (filter === "unpublished") where.push(eq(testimonials.isPublished, false));
  return db
    .select()
    .from(testimonials)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(testimonials.createdAt));
}

export async function getTestimonial(db: ManageDb, id: string): Promise<Testimonial | null> {
  return (await db.select().from(testimonials).where(eq(testimonials.id, id)))[0] ?? null;
}

/**
 * Update / publish / unpublish. Publishing requires `consentGiven` and refuses placeholder rows
 * (CLAUDE.md §12): the route answers 409 `consent_required` / `placeholder`.
 */
export async function updateTestimonial(
  db: ManageDb,
  id: string,
  input: z.output<typeof testimonialUpdateSchema>,
): Promise<
  | ({ ok: true } & Diff<Testimonial>)
  | { ok: false; reason: "not_found" | "consent_required" | "placeholder" }
> {
  const before = await getTestimonial(db, id);
  if (!before) return { ok: false, reason: "not_found" };
  const next = { ...before, ...definedOnly(input) };
  if (next.isPublished && next.isPlaceholder) return { ok: false, reason: "placeholder" };
  if (next.isPublished && !next.consentGiven) return { ok: false, reason: "consent_required" };
  const set = definedOnly(input) as Partial<Testimonial>;
  if (input.date !== undefined) set.date = input.date ? new Date(input.date) : null;
  const [after] = await db.update(testimonials).set(set).where(eq(testimonials.id, id)).returning();
  return { ok: true, before, after: after ?? null };
}

export async function deleteTestimonial(db: ManageDb, id: string): Promise<Testimonial | null> {
  return (await db.delete(testimonials).where(eq(testimonials.id, id)).returning())[0] ?? null;
}

// --- services ---------------------------------------------------------------------------------

export async function listServicesAdmin(db: ManageDb | null): Promise<Service[]> {
  if (!db) {
    return servicesSeed
      .map((s) => hydrate<Service>(SEED_NS.services, s.slug, s))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return db.select().from(services).orderBy(asc(services.sortOrder));
}

export async function getServiceAdmin(db: ManageDb | null, id: string): Promise<Service | null> {
  const all = await listServicesAdmin(db);
  return all.find((s) => s.id === id) ?? null;
}

export async function updateService(
  db: ManageDb,
  id: string,
  input: z.output<typeof serviceUpdateSchema>,
): Promise<Diff<Service>> {
  const before = (await db.select().from(services).where(eq(services.id, id)))[0] ?? null;
  if (!before) return { before: null, after: null };
  const set = definedOnly(input) as Partial<Service>;
  const [after] = await db.update(services).set(set).where(eq(services.id, id)).returning();
  return { before, after: after ?? null };
}

// --- faqs -------------------------------------------------------------------------------------

export async function listFaqsAdmin(db: ManageDb | null): Promise<Faq[]> {
  if (!db) return faqsSeed.map((f) => hydrate<Faq>(SEED_NS.faqs, faqSeedKey(f), f));
  return db.select().from(faqs).orderBy(asc(faqs.routePattern), asc(faqs.sortOrder));
}

export async function getFaqAdmin(db: ManageDb | null, id: string): Promise<Faq | null> {
  return (await listFaqsAdmin(db)).find((f) => f.id === id) ?? null;
}

export async function createFaq(db: ManageDb, input: z.output<typeof faqSchema>): Promise<Faq> {
  const [row] = await db
    .insert(faqs)
    .values({ ...input, locationId: input.locationId ?? null })
    .returning();
  if (!row) throw new Error("faq insert returned nothing");
  return row;
}

export async function updateFaq(
  db: ManageDb,
  id: string,
  input: z.output<typeof faqUpdateSchema>,
): Promise<Diff<Faq>> {
  const before = (await db.select().from(faqs).where(eq(faqs.id, id)))[0] ?? null;
  if (!before) return { before: null, after: null };
  const [after] = await db
    .update(faqs)
    .set(definedOnly(input) as Partial<Faq>)
    .where(eq(faqs.id, id))
    .returning();
  return { before, after: after ?? null };
}

export async function deleteFaq(db: ManageDb, id: string): Promise<Faq | null> {
  return (await db.delete(faqs).where(eq(faqs.id, id)).returning())[0] ?? null;
}

// --- locations --------------------------------------------------------------------------------

export interface LocationSummary {
  path: string;
  name: string;
  type: LocationRecord["type"];
  countryCode: string;
  researchStatus: LocationRecord["researchStatus"];
  contentUpdatedAt: string;
  isFeatured: boolean;
  /** Present only when the row lives in the database (editable). */
  id: string | null;
}

/** Every location with its status; editable ids come from the database when connected. */
export async function listLocationsAdmin(db: ManageDb | null): Promise<LocationSummary[]> {
  const records = await getAllLocations();
  const ids = new Map<string, string>();
  if (db) {
    const rows = await db.select({ id: locations.id, path: locations.path }).from(locations);
    for (const r of rows) ids.set(r.path, r.id);
  }
  return records.map((r) => ({
    path: r.path,
    name: r.name,
    type: r.type,
    countryCode: r.countryCode,
    researchStatus: r.researchStatus,
    contentUpdatedAt: r.contentUpdatedAt,
    isFeatured: Boolean(r.isFeatured),
    id: ids.get(r.path) ?? null,
  }));
}

export async function getLocationAdmin(
  db: ManageDb | null,
  path: string,
): Promise<{ record: LocationRecord; row: Location | null } | null> {
  const record = (await getAllLocations()).find((l) => l.path === path);
  if (!record) return null;
  const row = db
    ? ((await db.select().from(locations).where(eq(locations.path, path)))[0] ?? null)
    : null;
  return { record, row };
}

/** Research edit: status is re-derived, never trusted from the form. */
export async function updateLocation(
  db: ManageDb,
  path: string,
  input: z.output<typeof locationUpdateSchema>,
): Promise<Diff<Location>> {
  const before = (await db.select().from(locations).where(eq(locations.path, path)))[0] ?? null;
  if (!before) return { before: null, after: null };
  const set: Partial<Location> = {};
  if (input.research !== undefined) {
    set.research = input.research;
    set.researchStatus = deriveResearchStatus(input.research);
  }
  if (input.isFeatured !== undefined) set.isFeatured = input.isFeatured;
  if (input.contentUpdatedAt !== undefined) set.contentUpdatedAt = input.contentUpdatedAt;
  const [after] = await db.update(locations).set(set).where(eq(locations.path, path)).returning();
  return { before, after: after ?? null };
}
