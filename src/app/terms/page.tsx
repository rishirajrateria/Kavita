import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { LegalPage, getLegalDocument } from "@/components/legal";

const SLUG = "terms" as const;

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument(SLUG);
  return applyPageSeo(
    {
      title: { absolute: doc.metaTitle },
      description: doc.metaDescription,
      alternates: { canonical: `/${SLUG}`, types: { "text/markdown": `/${SLUG}.md` } },
      openGraph: {
        type: "website",
        url: `/${SLUG}`,
        title: doc.metaTitle,
        description: doc.metaDescription,
        siteName: "Astrologer Kavita",
      },
    },
    `/${SLUG}`,
  );
}

/** `/terms` — server-rendered; copy comes from `src/content/legal/terms.ts`. */
export default async function Page() {
  const doc = await getLegalDocument(SLUG);
  return <LegalPage doc={doc} />;
}
