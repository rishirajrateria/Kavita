import { CtaDisc } from "./cta-disc";

export interface CtaBandProps {
  eyebrow?: string;
  title: string;
  body: string;
  asAnswer?: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  motif?: "compass" | "south-chart";
  id?: string;
}

/**
 * @deprecated Thin wrapper over `CtaDisc` so pages not yet migrated still build. Replace with
 * `CtaDisc` and delete this file in Phase C.
 */
export function CtaBand(props: CtaBandProps) {
  return <CtaDisc {...props} />;
}
