import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Panel } from "@/components/admin/manage/panel";
import { CONTENT_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getArticles, getGlossaryTerms } from "@/lib/articles";

export const metadata: Metadata = { title: "Learn & glossary" };
export const dynamic = "force-dynamic";

/** Read-only in v1: articles are MDX and glossary terms are TypeScript in the repository. */
export default function GlossaryPage() {
  const terms = getGlossaryTerms();
  const articles = getArticles();
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Learn & glossary"
        description="Managed in the repository in v1 (src/content/articles/*.mdx and src/content/glossary.ts) so every change is reviewed, dated and versioned. Listed here for reference; editing arrives with the CMS phase."
      />
      <SubNav items={CONTENT_NAV} current="/admin/content/glossary" label="Content sections" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={`Articles (${articles.length})`}
          description="Published from MDX; dates come from the file's frontmatter."
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((a) => (
                <TableRow key={a.slug}>
                  <TableCell className="whitespace-normal">
                    <Link
                      href={`/learn/${a.category}/${a.slug}`}
                      className="no-underline hover:underline"
                    >
                      {a.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="caps">{a.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {a.dateModified ?? a.datePublished}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <Panel
          title={`Glossary terms (${terms.length})`}
          description="One DefinedTerm page each."
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Term</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Short definition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.slug}>
                  <TableCell>
                    <Link
                      href={`/glossary/${t.slug}`}
                      className="font-medium no-underline hover:underline"
                    >
                      {t.term}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="caps">{t.category}</Badge>
                  </TableCell>
                  <TableCell
                    className="hidden max-w-[20rem] truncate text-muted-foreground sm:table-cell"
                    title={t.short}
                  >
                    {t.short}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
