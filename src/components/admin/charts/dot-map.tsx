/**
 * Equirectangular dot map: a quiet graticule (every 30°) and a dot per known place, radius by
 * the square root of visitors so area is proportional. No basemap dependency — the geography
 * reads from the dots themselves and from the labelled top places. Places without coordinates
 * are listed below the map rather than guessed.
 */
import { ChartFrame } from "./chart-frame";
import { CHART_FONT, formatNumber } from "./tokens";

export interface MapDot {
  name: string;
  lat: number;
  lng: number;
  visitors: number;
}

export interface DotMapProps {
  title: string;
  description: string;
  dots: MapDot[];
  /** Places from the data that could not be matched to coordinates. */
  unmatched?: { name: string; visitors: number }[];
  emptyText?: string;
  className?: string;
}

const W = 720;
const H = 360;
const MAX_R = 16;

export function DotMap({
  title,
  description,
  dots,
  unmatched = [],
  emptyText = "No located visitors in this range.",
  className,
}: DotMapProps) {
  const sorted = [...dots].sort((a, b) => b.visitors - a.visitors);
  const max = Math.max(1, ...sorted.map((d) => d.visitors));
  const px = (lng: number) => ((lng + 180) / 360) * W;
  const py = (lat: number) => ((90 - lat) / 180) * H;
  const r = (v: number) => Math.max(3, Math.sqrt(v / max) * MAX_R);
  const labelled = sorted.slice(0, 8);

  return (
    <ChartFrame
      title={title}
      description={description}
      viewBox={{ width: W, height: H }}
      table={{
        columns: ["Place", "Visitors", "Latitude", "Longitude"],
        rows: [
          ...sorted.map((d) => [
            d.name,
            formatNumber(d.visitors),
            d.lat.toFixed(2),
            d.lng.toFixed(2),
          ]),
          ...unmatched.map((u) => [u.name, formatNumber(u.visitors), "–", "–"]),
        ],
      }}
      empty={sorted.length === 0 ? emptyText : null}
      className={className}
      after={
        unmatched.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Not on the map (no coordinates):{" "}
            {unmatched
              .slice(0, 12)
              .map((u) => `${u.name} (${formatNumber(u.visitors)})`)
              .join(", ")}
            {unmatched.length > 12 ? ` and ${unmatched.length - 12} more` : ""}
          </p>
        ) : null
      }
    >
      <g fontFamily={CHART_FONT} fontSize={10}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--series-1)" opacity={0.05} />
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line
            key={`lat${lat}`}
            x1={0}
            x2={W}
            y1={py(lat)}
            y2={py(lat)}
            stroke="var(--chart-grid)"
            strokeWidth={lat === 0 ? 1.2 : 1}
          />
        ))}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) => (
          <line
            key={`lng${lng}`}
            x1={px(lng)}
            x2={px(lng)}
            y1={0}
            y2={H}
            stroke="var(--chart-grid)"
            strokeWidth={lng === 0 ? 1.2 : 1}
          />
        ))}
        {sorted.map((d) => (
          <g key={`${d.name}-${d.lat}-${d.lng}`} className="group">
            <title>{`${d.name}: ${formatNumber(d.visitors)} visitors`}</title>
            <circle
              cx={px(d.lng)}
              cy={py(d.lat)}
              r={Math.max(12, r(d.visitors) + 6)}
              fill="transparent"
            />
            <circle
              cx={px(d.lng)}
              cy={py(d.lat)}
              r={r(d.visitors)}
              fill="var(--series-1)"
              fillOpacity={0.55}
              stroke="var(--chart-surface)"
              strokeWidth={1.5}
              className="group-hover:fill-opacity-90"
            />
          </g>
        ))}
        {labelled.map((d, i) => (
          <text
            key={`label-${d.name}`}
            x={px(d.lng) + r(d.visitors) + 4}
            y={py(d.lat) + (i % 2 === 0 ? -4 : 12)}
            fill="var(--foreground)"
            paintOrder="stroke"
            stroke="var(--chart-surface)"
            strokeWidth={3}
            strokeLinejoin="round"
          >
            {d.name}
          </text>
        ))}
      </g>
    </ChartFrame>
  );
}
