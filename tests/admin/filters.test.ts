import { check, equal } from "../seo-plumbing/_assert";
import {
  buildHref,
  carriedParams,
  geoLabel,
  pageWindow,
  parsePanelParams,
} from "@/components/admin/filters/search-params";

const NOW = new Date("2026-09-11T10:30:00Z");

export function run() {
  const def = parsePanelParams({}, NOW);
  equal(def.range.preset, "30d", "default preset");
  equal(def.range.from, "2026-08-13", "default 30d from");
  equal(def.range.to, "2026-09-11", "default to");
  equal(def.range.days, 30, "default days");
  equal(def.range.previous.to, "2026-08-12", "previous period ends the day before");
  equal(def.page, 1, "default page");
  equal(def.dir, "desc", "default dir");

  equal(parsePanelParams({ range: "7d" }, NOW).range.from, "2026-09-05", "7d preset");
  equal(parsePanelParams({ range: "last_month" }, NOW).range.to, "2026-08-31", "last month preset");

  const custom = parsePanelParams({ range: "custom", from: "2026-08-20", to: "2026-08-01" }, NOW);
  equal(custom.range.preset, "custom", "custom preset");
  equal(custom.range.from, "2026-08-01", "custom swaps reversed bounds");
  equal(custom.range.days, 20, "custom days");

  const bad = parsePanelParams(
    { range: "custom", from: "nope", to: "2026-08-01", page: "-3" },
    NOW,
  );
  equal(bad.range.from, "2026-08-13", "invalid custom dates → 30d bounds");
  equal(bad.page, 1, "negative page clamps to 1");
  equal(parsePanelParams({ page: "999999" }, NOW).page, 10_000, "page clamps to 10,000");

  const geo = parsePanelParams(
    {
      country: "in",
      region: "Maharashtra",
      city: "Mumbai",
      path: "/about",
      sort: "visitors",
      dir: "asc",
      kind: "entry",
    },
    NOW,
  );
  equal(geo.geo.country, "IN", "country upper-cased");
  equal(geo.geo.city, "Mumbai", "city kept");
  equal(geo.path, "/about", "path kept");
  equal(geo.dir, "asc", "dir asc");
  equal(geo.kind, "entry", "kind kept");
  equal(geoLabel(geo.geo), "Mumbai, Maharashtra, IN", "geo label");
  equal(
    parsePanelParams({ region: "Orphan" }, NOW).geo.region,
    undefined,
    "region without country dropped",
  );
  equal(
    parsePanelParams({ path: "javascript:alert(1)" }, NOW).path,
    undefined,
    "non-path rejected",
  );
  equal(
    parsePanelParams({ path: "//evil" }, NOW).path,
    undefined,
    "protocol-relative path rejected",
  );

  equal(
    buildHref(
      "/admin/traffic",
      { range: "7d", country: "IN", page: "3" },
      { page: undefined, sort: "visitors" },
    ),
    "/admin/traffic?range=7d&country=IN&sort=visitors",
    "buildHref keeps filters, drops page, adds sort",
  );
  equal(buildHref("/admin", {}, {}), "/admin", "buildHref without params");
  const carried = carriedParams({ range: "7d", country: "IN", from: "x" }, ["range", "from"]);
  check(carried.length === 1 && carried[0]?.[0] === "country", "carriedParams excludes named keys");
  equal(pageWindow(3, 25).offset, 50, "pageWindow offset");
}
