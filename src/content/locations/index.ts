/**
 * The location tree as a typed data source (CLAUDE.md §6): base geography from `./base` plus
 * hand-written §7 research from `./research`, merged into `LocationRecord`s with the research
 * status derived by `deriveResearchStatus()`. Tier 2/3 = more base rows + more research files;
 * nothing in page code changes.
 *
 * Structural integrity (unique paths, existing parents, unique slugs per parent, slug format,
 * every record passing `locationBaseSchema`) is checked once at module load and throws — a
 * broken tree must fail the build, not render half a site.
 */
import { baseLocations } from "./base";
import { researchByPath } from "./research";
import {
  deriveResearchStatus,
  locationBaseSchema,
  pathForResearchStem,
  researchModuleSchema,
  type LocationBase,
  type LocationRecord,
  type LocationResearch,
} from "./schema";
import { z } from "zod";

export * from "./schema";
export { baseLocations } from "./base";

const locationTreeSchema = z.array(locationBaseSchema).superRefine((list, ctx) => {
  const paths = new Set<string>();
  const siblingSlugs = new Set<string>();
  list.forEach((loc, i) => {
    if (paths.has(loc.path)) {
      ctx.addIssue({ code: "custom", path: [i, "path"], message: `duplicate path ${loc.path}` });
    }
    paths.add(loc.path);
    const key = `${loc.parentPath ?? ""}::${loc.slug}`;
    if (siblingSlugs.has(key)) {
      ctx.addIssue({ code: "custom", path: [i, "slug"], message: `duplicate sibling slug ${key}` });
    }
    siblingSlugs.add(key);
  });
  list.forEach((loc, i) => {
    if (loc.parentPath && !paths.has(loc.parentPath)) {
      ctx.addIssue({
        code: "custom",
        path: [i, "parentPath"],
        message: `${loc.path}: parent ${loc.parentPath} does not exist`,
      });
    }
  });
});

function validateTree(list: readonly LocationBase[]): LocationBase[] {
  const result = locationTreeSchema.safeParse(list);
  if (!result.success) {
    throw new Error(`Location tree is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Validated base records, parent-first. Synchronous; no research attached. */
export const validatedBaseLocations: readonly LocationBase[] = validateTree(baseLocations);

export const getBaseLocation = (path: string): LocationBase | undefined =>
  validatedBaseLocations.find((l) => l.path === path);

/** Problems found while loading research modules; the seed test fails if any exist. */
export type ResearchProblem = { stem: string; message: string };

type LoadedResearch = {
  byPath: Map<string, { research: LocationResearch; contentUpdatedAt: string }>;
  problems: ResearchProblem[];
};

let loaded: Promise<LoadedResearch> | undefined;

/**
 * Loads every research module once. An invalid module is reported (and its location stays a
 * stub) rather than thrown, so one writer's mid-edit file cannot take the whole site down;
 * `pnpm test` turns the report into a failure.
 */
export function loadResearch(): Promise<LoadedResearch> {
  loaded ??= (async () => {
    const byPath: LoadedResearch["byPath"] = new Map();
    const problems: ResearchProblem[] = [];
    const known = new Set(validatedBaseLocations.map((l) => l.path));
    for (const [stem, load] of Object.entries(researchByPath)) {
      const path = pathForResearchStem(stem);
      if (!known.has(path)) {
        problems.push({ stem, message: `no base record for path ${path}` });
        continue;
      }
      try {
        const mod = await load();
        const parsed = researchModuleSchema.safeParse(mod);
        if (!parsed.success) {
          problems.push({ stem, message: z.prettifyError(parsed.error) });
          continue;
        }
        byPath.set(path, parsed.data);
      } catch (error) {
        problems.push({ stem, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return { byPath, problems };
  })();
  return loaded;
}

function merge(
  base: LocationBase,
  extra?: { research: LocationResearch; contentUpdatedAt: string },
): LocationRecord {
  if (!extra) return { ...base, researchStatus: "stub" };
  const contentUpdatedAt =
    extra.contentUpdatedAt > base.contentUpdatedAt ? extra.contentUpdatedAt : base.contentUpdatedAt;
  return {
    ...base,
    contentUpdatedAt,
    researchStatus: deriveResearchStatus(extra.research),
    research: extra.research,
  };
}

/** Base + research, parent-first, with `researchStatus` derived. The content-mode source. */
export async function getLocationRecords(): Promise<LocationRecord[]> {
  const { byPath } = await loadResearch();
  return validatedBaseLocations.map((base) => merge(base, byPath.get(base.path)));
}
