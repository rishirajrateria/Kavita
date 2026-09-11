import {
  CORE_ROUTES,
  getCoreRoute,
  isIndexable,
  listIndexableCoreRoutes,
  normalisePath,
} from "@/lib/routes";
import { ROUTE_DATES } from "@/content/route-dates";
import { check, equal } from "./_assert";

export function run(): void {
  for (const p of [
    "/admin",
    "/admin/x",
    "/api",
    "/api/md",
    "/_next/static",
    "/design-system",
    "/book",
  ]) {
    equal(isIndexable(p), false, `${p} not indexable`);
  }
  for (const p of ["/", "/about", "/for-ai", "/astrologer/india", "/bookings"]) {
    equal(isIndexable(p), true, `${p} indexable`);
  }
  equal(normalisePath("about/"), "/about", "normalise trailing slash");
  equal(normalisePath("/about?x=1#y"), "/about", "normalise query/hash");
  equal(normalisePath("/"), "/", "normalise root");

  const paths = CORE_ROUTES.map((r) => r.path);
  for (const required of [
    "/",
    "/about",
    "/astrology",
    "/vastu",
    "/services",
    "/learn",
    "/testimonials",
    "/book",
    "/contact",
    "/faq",
    "/for-ai",
    "/privacy",
    "/terms",
    "/disclaimer",
  ]) {
    check(paths.includes(required), `core route ${required} registered`);
  }
  equal(new Set(paths).size, paths.length, "no duplicate core routes");
  check(
    CORE_ROUTES.every((r) => r.priority >= 0 && r.priority <= 1),
    "priorities in range",
  );
  check(
    listIndexableCoreRoutes().every((r) => r.exists && r.indexable),
    "indexable list filtered",
  );
  check(
    listIndexableCoreRoutes().every((r) => ROUTE_DATES[r.path] !== undefined),
    "every existing indexable route has a lastmod date",
  );
  equal(getCoreRoute("/for-ai/")?.exists, true, "for-ai exists");
  check(
    Object.values(ROUTE_DATES).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    "route dates are YYYY-MM-DD",
  );
}
