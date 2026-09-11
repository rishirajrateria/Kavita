"use client";

/**
 * Weekly availability editor: seven columns, any number of open intervals per day, times in the
 * practitioner's zone. Posts the whole grid to `PUT /api/admin/availability` (replace-all, one
 * transaction). Keyboard-only friendly: every control is a native input or button.
 */
import { useState } from "react";
import { ActionForm } from "./action-form";

export interface GridRule {
  weekday: number;
  startTime: string;
  endTime: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityGrid({
  initial,
  timezone,
  disabled,
  placeholder,
}: {
  initial: GridRule[];
  timezone: string;
  disabled?: boolean;
  /** True while the unconfirmed seed hours are shown. */
  placeholder?: boolean;
}) {
  const [rules, setRules] = useState<GridRule[]>(initial);
  const update = (i: number, patch: Partial<GridRule>) =>
    setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRules(rules.filter((_, j) => j !== i));
  const add = (weekday: number) =>
    setRules([...rules, { weekday, startTime: "10:00", endTime: "13:00" }]);
  const copyMonday = () => {
    const monday = rules.filter((r) => r.weekday === 1);
    setRules([
      ...rules.filter((r) => r.weekday === 0 || r.weekday === 1 || r.weekday === 6),
      ...[2, 3, 4, 5].flatMap((d) => monday.map((r) => ({ ...r, weekday: d }))),
    ]);
  };
  const totalHours = rules.reduce(
    (n, r) => n + (minutes(r.endTime) - minutes(r.startTime)) / 60,
    0,
  );

  return (
    <ActionForm
      action="/api/admin/availability"
      method="PUT"
      payload={{ rules: rules.map((r) => ({ ...r, isActive: true })) }}
      submitLabel="Save weekly hours"
      disabled={disabled}
      successMessage="Weekly hours saved; the booking calendar uses them from now on."
      className="gap-4"
    >
      {placeholder ? (
        <p className="rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">
          These are the assumed seed hours ({"{{WORKING_HOURS}}"} in NEEDS-REAL-DATA.md). Save once
          to make them real.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {ORDER.map((d) => {
          const dayRules = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d);
          return (
            <fieldset
              key={d}
              className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background/60 p-3"
            >
              <legend className="px-1 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {DAYS[d]}
              </legend>
              {dayRules.length === 0 ? (
                <p className="text-xs text-muted-foreground">Closed</p>
              ) : null}
              {dayRules.map(({ r, i }) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 rounded-md border border-border/70 bg-card p-2"
                >
                  <label className="flex items-center justify-between gap-2 text-[0.68rem] text-muted-foreground">
                    From
                    <input
                      type="time"
                      value={r.startTime}
                      step={900}
                      aria-label={`${DAYS[d]} opens`}
                      onChange={(e) => update(i, { startTime: e.target.value })}
                      className={timeClass}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-[0.68rem] text-muted-foreground">
                    To
                    <input
                      type="time"
                      value={r.endTime}
                      step={900}
                      aria-label={`${DAYS[d]} closes`}
                      onChange={(e) => update(i, { endTime: e.target.value })}
                      className={timeClass}
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    {r.endTime <= r.startTime ? (
                      <span className="text-[0.68rem] text-error">end after start</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-[0.68rem] text-muted-foreground hover:text-error"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => add(d)}
                className="self-start text-xs text-accent-strong underline-offset-4 hover:underline"
              >
                + interval
              </button>
            </fieldset>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>
          {totalHours.toFixed(1)} bookable hours per week · times in {timezone}
        </span>
        <button
          type="button"
          onClick={copyMonday}
          className="text-accent-strong underline-offset-4 hover:underline"
        >
          Copy Monday to Tue–Fri
        </button>
      </div>
    </ActionForm>
  );
}

const timeClass =
  "h-8 w-[6.7rem] max-w-full rounded-md border border-input bg-transparent px-1.5 text-xs text-foreground shadow-xs dark:bg-input/30";

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
