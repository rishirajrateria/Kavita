import type { Thing, WithContext } from "@/lib/seo/schema";

export interface JsonLdProps {
  /** One schema object, or several to emit as a single JSON array. */
  data: WithContext<Thing> | WithContext<Thing>[];
  id?: string;
}

/**
 * Escape characters that could terminate the script element or be mis-parsed as HTML. JSON
 * parsers read `<` back as `<`, so the structured data is unchanged.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Server component: renders structured data as `<script type="application/ld+json">`. */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
