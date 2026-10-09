import type { FaqItem } from "@/lib/seo/schema";
import { Foot } from "./foot";

export interface FaqBlockProps {
  heading: string;
  answer?: string;
  eyebrow?: string;
  items: FaqItem[];
  id?: string;
  tone?: "default" | "muted";
  withSchema?: boolean;
  className?: string;
  route?: string;
}

/**
 * @deprecated Thin wrapper over `Foot` so pages not yet migrated still build. `eyebrow` and
 * `tone` are accepted and ignored (the foot is the page's one inverse band). Replace with
 * `Foot` and delete this file in Phase C.
 */
export function FaqBlock({
  heading,
  answer,
  items,
  id = "faq",
  withSchema = true,
  className,
  route,
}: FaqBlockProps) {
  return (
    <Foot
      id={id}
      route={route}
      heading={heading}
      answer={answer}
      faqs={items}
      withSchema={withSchema}
      className={className}
    />
  );
}
