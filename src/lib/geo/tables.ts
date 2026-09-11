/**
 * The one specification table each geo page carries (CLAUDE.md §9.4). Builders are pure and
 * return plain rows so the same data feeds the HTML table, the markdown mirror and the
 * uniqueness gate. Nothing here states a fact that is not in the location record, the
 * research, the runtime's time-zone database or `site_settings`.
 */
import type { ChartStyle, LocationRecord } from "@/content/locations/schema";
import type { GeoService, SiteSettings } from "@/lib/data/types";
import { computeConsultationWindow } from "@/lib/data/locations";
import { formatOffset, observesDst, offsetBetween, utcLabel, zoneAbbreviation } from "./timezones";

export interface GeoTable {
  id: string;
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}

export const CHART_STYLE_LABEL: Record<ChartStyle, string> = {
  "north-indian": "North Indian (diamond) chart",
  "south-indian": "South Indian (square) chart",
  "east-indian": "East Indian (Bengali) chart",
  mixed: "North or South Indian chart, whichever the family already uses",
};

/** Plain text of every cell, for the uniqueness gate and markdown mirror. */
export function tableText(table: GeoTable): string {
  return [table.caption, ...table.rows.flat()].join("\n");
}

/**
 * City table. Astrology: how a chart is cast and read for someone born there. Vastu: what to
 * prepare for a review of that housing type. Pure — research fields only.
 */
export function cityTable(loc: LocationRecord, service: GeoService): GeoTable | null {
  const r = loc.research;
  if (!r) return null;
  const name = loc.name;

  if (service === "astrologer") {
    const rows: string[][] = [
      ["Chart style", CHART_STYLE_LABEL[r.tradition.chartStyle]],
      ["Calendar", r.tradition.calendar],
    ];
    if (r.tradition.monthReckoning) {
      rows.push(["Month reckoning", MONTH_RECKONING_LABEL[r.tradition.monthReckoning]]);
    }
    rows.push(
      ["Birth records", r.tradition.birthRecordsNote],
      [
        "Birth time zone",
        `${loc.timezone} (${utcLabel(loc.timezone)}${observesDst(loc.timezone) ? ", observes daylight saving" : ", no daylight saving"})`,
      ],
      ["Languages of consultation", loc.languages.join(", ")],
      [
        "What to send",
        "Date, exact time and place of birth for each person, and how sure you are of the time",
      ],
    );
    return {
      id: "chart-table",
      caption: `How a kundli is cast and read for someone born in ${name}.`,
      columns: ["Item", `For ${name}`],
      rows,
    };
  }

  const ca = r.climateArchitecture;
  const rows: string[][] = [["Housing stock", ca.housingStock]];
  if (ca.plotOrientation) rows.push(["Plot orientation", ca.plotOrientation]);
  ca.facts.forEach((fact, i) => rows.push([`Site condition ${i + 1}`, fact]));
  rows.push(
    ["Floor plan", "A floor plan or careful hand sketch with north marked"],
    ["Compass reading", "Taken at the main entrance, standing inside and facing out"],
    ["Photographs", "Entrance, kitchen, main bedroom and any room that concerns you"],
    [
      "Occupants' charts",
      "Birth details of the people who live there, so the home is read for them",
    ],
  );
  return {
    id: "vastu-table",
    caption: `What to prepare for a vastu review of a home in ${name}.`,
    columns: ["Item", `For a ${name} home`],
    rows,
  };
}

const MONTH_RECKONING_LABEL = {
  amanta: "Amanta — the month ends on the new moon",
  purnimanta: "Purnimanta — the month ends on the full moon",
  solar: "Solar — months follow the Sun's entry into each sign",
  mixed: "Mixed — Amanta or Purnimanta by family origin",
} as const;

/**
 * Country table: every time zone in use across the country's publishable places, with today's
 * UTC offset, whether it observes daylight saving, and the live-session window computed from
 * the practitioner's business hours.
 */
export function countryTable(
  loc: LocationRecord,
  descendants: readonly LocationRecord[],
  settings: SiteSettings,
): GeoTable {
  const byZone = new Map<string, LocationRecord[]>();
  for (const place of [loc, ...descendants]) {
    const list = byZone.get(place.timezone) ?? [];
    list.push(place);
    byZone.set(place.timezone, list);
  }
  const rows = [...byZone.entries()]
    .sort((a, b) => offsetBetween(a[0], "UTC") - offsetBetween(b[0], "UTC"))
    .map(([zone, places]) => {
      const representative = places.find((p) => p.type === "city") ?? places[0] ?? loc;
      const window = computeConsultationWindow(representative, settings);
      const names = places.filter((p) => p.type !== "country").map((p) => p.shortName ?? p.name);
      return [
        `${zone} (${zoneAbbreviation(zone)})`,
        utcLabel(zone),
        observesDst(zone) ? "Yes" : "No",
        names.length
          ? names.slice(0, 4).join(", ") + (names.length > 4 ? "…" : "")
          : "Whole country",
        window.offsetLabel,
        window.localWindow,
      ];
    });
  return {
    id: "timezone-table",
    caption: `Time zones in ${loc.name} and when a live session with Astrologer Kavita falls in local hours (offsets as of today; the practitioner keeps ${settings.timezone}).`,
    columns: [
      "Time zone",
      "UTC offset",
      "Daylight saving",
      "Places",
      "Difference from practitioner",
      "Live-session window (local)",
    ],
    rows,
  };
}

/** State table: the publishable cities in the region and their live-session windows. */
export function stateTable(
  loc: LocationRecord,
  children: readonly LocationRecord[],
  settings: SiteSettings,
): GeoTable | null {
  if (children.length === 0) return null;
  return {
    id: "cities-table",
    caption: `Cities in ${loc.name} where Astrologer Kavita consults, with each one's time difference and live-session window in local time.`,
    columns: ["City", "Time zone", "Difference from practitioner", "Live-session window (local)"],
    rows: children.map((city) => {
      const window = computeConsultationWindow(city, settings);
      return [
        city.name,
        `${city.timezone} (${utcLabel(city.timezone)})`,
        window.offsetLabel,
        window.localWindow,
      ];
    }),
  };
}

/** Fallback table when a region has no publishable cities yet: the consultation modes. */
export function modesTable(
  loc: LocationRecord,
  service: GeoService,
  settings: SiteSettings,
): GeoTable {
  const window = computeConsultationWindow(loc, settings);
  const diff = formatOffset(window.offsetMinutesFromPractitioner);
  const rows: string[][] = [
    [
      "Video call",
      "A stable connection and a camera; the chart or floor plan is shared on screen",
      `${window.localWindow} in ${loc.name} (${diff} from the practitioner)`,
    ],
    [
      "Phone call",
      "A phone number and your birth details or floor plan sent in advance",
      `${window.localWindow} in ${loc.name}`,
    ],
  ];
  if (service === "vastu-consultant") {
    rows.push([
      "Floor-plan review",
      "A plan with north marked, a compass reading at the entrance and photographs",
      "Any time; the written observations follow the review",
    ]);
  }
  if (settings.inPersonAvailable) {
    rows.push([
      "In person",
      `A visit in ${settings.city}; travel elsewhere by arrangement`,
      "Business hours in the practitioner's time zone",
    ]);
  }
  return {
    id: "modes-table",
    caption: `How a consultation from ${loc.name} takes place and when it falls in local time.`,
    columns: ["Mode", "What it needs", "When"],
    rows,
  };
}
