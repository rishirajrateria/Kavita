/**
 * Resolve a catch-all route's segments to a publishable location, or null (→ 404). Shared by
 * the `/astrologer/[...path]` and `/vastu-consultant/[...path]` templates.
 */
import { PATH_PATTERN, isPublishable, type LocationRecord } from "@/content/locations/schema";
import { getLocationByPath } from "@/lib/data/locations";

export async function resolvePublishableLocation(
  segments: readonly string[] | undefined,
): Promise<LocationRecord | null> {
  if (!segments || segments.length < 1 || segments.length > 3) return null;
  const path = segments.join("/");
  if (!PATH_PATTERN.test(path)) return null;
  const loc = await getLocationByPath(path);
  return loc && isPublishable(loc) ? loc : null;
}
