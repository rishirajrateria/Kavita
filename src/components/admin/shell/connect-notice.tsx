/** Honest banner shown at the top of a panel when no analytics database is configured. */
import { DatabaseIcon } from "lucide-react";

export function ConnectNotice({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="flex items-start gap-3 rounded-xl border border-dashed border-accent-border/60 bg-surface-gold px-4 py-3 text-sm text-foreground"
    >
      <DatabaseIcon className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
