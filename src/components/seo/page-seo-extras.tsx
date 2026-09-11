import { pageSeoExtras, resolvePageSeo } from "@/lib/seo/page-seo";

/**
 * Head tags from the page's `page_seo` override that the Metadata API cannot express: JSON-LD
 * blocks (from the sanitised custom head and `structured_data_overrides`) and `<link>` rels
 * other than canonical/alternate. React 19 hoists `<link>` into `<head>`; JSON-LD is valid
 * anywhere in the document. Renders nothing with no database or no override.
 */
export async function PageSeoExtras({ route }: { route: string }) {
  const row = await resolvePageSeo(route);
  const extras = pageSeoExtras(row);
  if (extras.length === 0) return null;
  return (
    <>
      {extras.map((tag, i) =>
        tag.kind === "jsonld" ? (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(tag.json).replaceAll("<", "\\u003c"),
            }}
          />
        ) : (
          <link key={i} {...tag.attrs} />
        ),
      )}
    </>
  );
}
