import { NativeSelect } from "@/components/forms/field";
import { BOOK_TIME_STEP } from "@/content/pages/book";
import { zoneOptionLabel } from "@/lib/booking/format";
import { ALL_ZONES, ZONE_GROUPS } from "./timezones";

export interface ZoneSelectProps {
  value: string;
  onChange: (zone: string) => void;
  /** Extra zones (the detected one, the location's) to offer at the top when not listed. */
  extra: string[];
  at: string;
  id?: string;
}

/** IANA zone selector grouped by market; the detected zone is always selectable. */
export function ZoneSelect({ value, onChange, extra, at, id = "booking-tz" }: ZoneSelectProps) {
  const extras = Array.from(new Set(extra.filter((z) => z && !ALL_ZONES.includes(z))));
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {BOOK_TIME_STEP.timezoneLabel}
      </label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11"
      >
        {extras.length > 0 ? (
          <optgroup label={BOOK_TIME_STEP.detectedGroup}>
            {extras.map((z) => (
              <option key={z} value={z}>
                {zoneOptionLabel(z, at)}
              </option>
            ))}
          </optgroup>
        ) : null}
        {ZONE_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.zones.map((z) => (
              <option key={z} value={z}>
                {zoneOptionLabel(z, at)}
              </option>
            ))}
          </optgroup>
        ))}
      </NativeSelect>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
        {BOOK_TIME_STEP.timezoneHint}
      </p>
    </div>
  );
}
