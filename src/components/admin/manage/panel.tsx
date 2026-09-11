import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card with the gold hairline used for every management block. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-accent-border/40 bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-medium tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Shown on edit screens when there is no database: the layout stays, writes are disabled. */
export function OfflineNote({ what = "Edits" }: { what?: string }) {
  return (
    <p
      role="status"
      className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning"
    >
      Not connected to Supabase — showing the repository seed read-only. {what} are saved once{" "}
      <code>SUPABASE_DB_URL</code> is set.
    </p>
  );
}

/** Definition-list row used on detail screens. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Checkbox that always posts a value: a hidden `off` precedes the box, so an unticked box sends
 * `"off"` and a ticked one `"on"` (last value wins in `ActionForm`).
 */
export function CheckboxField({
  name,
  label,
  defaultChecked,
  hint,
  className,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex items-start gap-2 text-sm", className)}>
      <input type="hidden" name={name} value="off" />
      <input
        type="checkbox"
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-[var(--accent-strong)]"
      />
      <span>
        {label}
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}
