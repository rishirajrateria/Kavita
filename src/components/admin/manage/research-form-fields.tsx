"use client";

/** Field primitives for the location research editor (split out to keep files under 500 lines). */
import { wordCount } from "@/content/locations/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function Section({
  title,
  hint,
  count,
  ok,
  children,
}: {
  title: string;
  hint?: string;
  count?: string;
  ok?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs">
      <legend className="px-1 font-serif text-lg font-medium tracking-tight">{title}</legend>
      <div className="-mt-1 flex flex-wrap items-baseline justify-between gap-2">
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {count ? (
          <span
            className={cn("text-xs font-medium", ok === false ? "text-warning" : "text-success")}
          >
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function WordArea({
  label,
  value,
  min,
  max,
  rows = 6,
  onChange,
  extra,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  rows?: number;
  onChange: (v: string) => void;
  extra?: string | null;
}) {
  const n = wordCount(value);
  const ok = n >= min && n <= max && !extra;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between gap-2">
        {label}
        <span className={cn("text-xs tabular-nums", ok ? "text-success" : "text-warning")}>
          {n} / {min}–{max} words{extra ? ` · ${extra}` : ""}
        </span>
      </span>
      <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function AddButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="self-start text-sm text-accent-strong underline-offset-4 hover:underline disabled:opacity-40"
    >
      + {label}
    </button>
  );
}

export function RemoveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Remove"
      className="h-9 shrink-0 rounded-md border border-border px-2 text-sm text-muted-foreground hover:text-error disabled:opacity-40"
    >
      ×
    </button>
  );
}
