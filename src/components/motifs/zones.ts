/**
 * The nine zones of a plan, read the way vastu reads one: a square divided into thirds, north
 * up, with the brahmasthan at the centre. `FloorPlan` and `VastuDirections` share this so that
 * `highlight="south-west"` means the same corner in both drawings — a reader who learns the
 * corner from one figure recognises it in the other.
 */
export type DirectionZone =
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west"
  | "centre"
  | "none";

/** Column (0 = west) and row (0 = north) of each zone in the three-by-three grid. */
const ZONE_CELL: Record<Exclude<DirectionZone, "none">, readonly [number, number]> = {
  "north-west": [0, 0],
  north: [1, 0],
  "north-east": [2, 0],
  west: [0, 1],
  centre: [1, 1],
  east: [2, 1],
  "south-west": [0, 2],
  south: [1, 2],
  "south-east": [2, 2],
};

export interface ZoneRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The rectangle a zone occupies inside a square of side `size` whose top-left corner is at
 * (`origin`, `origin`). Returns `null` for `"none"`, so a caller can render nothing without a
 * second branch.
 */
export function zoneRect(zone: DirectionZone, origin: number, size: number): ZoneRect | null {
  if (zone === "none") return null;
  const cell = ZONE_CELL[zone];
  const third = size / 3;
  return {
    x: origin + cell[0] * third,
    y: origin + cell[1] * third,
    width: third,
    height: third,
  };
}
