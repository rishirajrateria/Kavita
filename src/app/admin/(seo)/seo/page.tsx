/**
 * `/admin/seo` — every page's SEO overrides in one list: the core routes from the route
 * registry, then every override row (globs and geo routes included). Nothing here fetches the
 * live pages; the per-page editor does that when it is opened.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CORE_ROUTES, normalisePath } from "@/lib/routes";
import { listPageSeoRows, type PageSeoRow } from "@/lib/seo/page-seo";
import { isGlobPattern } from "@/lib/seo/route-pattern";

export const metadata: Metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

/** `/` → `/admin/seo/index`; `/astrologer/india/*` → each segment encoded. */
export function editorHref(pattern: string): string {
  const path = pattern === "/" ? "index" : pattern.replace(/^\//, "");
  return `/admin/seo/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function overrideSummary(row: PageSeoRow): string[] {
  const set: string[] = [];
  if (row.title) set.push("title");
  if (row.metaDescription) set.push("description");
  if (row.canonicalUrl) set.push("canonical");
  if (row.robots && Object.keys(row.robots).length) set.push("robots");
  if (row.ogTitle || row.ogDescription || row.ogImageUrl || row.ogText) set.push("social");
  if (row.hreflang) set.push("hreflang");
  if (row.customHeadHtml) set.push("custom head");
  if (row.structuredDataOverrides) set.push("JSON-LD");
  return set;
}

export default async function SeoPage({ searchParams }: PageProps<"/admin/seo">) {
  const params = await searchParams;
  const wanted = typeof params.route === "string" ? params.route.trim() : "";
  if (wanted) redirect(editorHref(wanted.includes("*") ? wanted : normalisePath(wanted)));

  const db = getDb();
  const rows = await listPageSeoRows();
  const byPattern = new Map(rows.map((r) => [r.routePattern, r]));
  const core = CORE_ROUTES.filter((r) => r.exists);
  const extra = rows.filter((r) => !core.some((c) => c.path === r.routePattern));

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Page SEO"
        description="One override per route or glob: title, description, canonical, robots, social cards, hreflang and a sanitised custom head snippet. Overrides win over what the page builds for itself; everything else is left alone."
      />
      <SeoNav current="/admin/seo" />
      {!db ? <OfflineNote what="Overrides" /> : null}

      <div className="mb-6 grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <dl className="grid content-start gap-3 sm:grid-cols-3">
          <Stat label="Core routes" value={String(core.length)} />
          <Stat label="Overrides saved" value={String(rows.length)} />
          <Stat
            label="Pattern rules"
            value={String(rows.filter((r) => isGlobPattern(r.routePattern)).length)}
          />
        </dl>
        <Panel title="Open any route">
          <form method="get" action="/admin/seo" className="flex flex-col gap-3">
            <Field
              label="Route or pattern"
              htmlFor="route"
              hint="e.g. /astrologer/india/maharashtra/mumbai, or /astrologer/india/* for every page under it."
            >
              <Input id="route" name="route" placeholder="/astrologer/india" spellCheck={false} />
            </Field>
            <Button type="submit" variant="gold-outline" size="sm" className="self-start">
              Open editor
            </Button>
          </form>
        </Panel>
      </div>

      <Panel
        title="Core pages"
        description="From the route registry (CLAUDE.md §5)."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Route</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Indexable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {core.map((route) => {
                const row = byPattern.get(route.path);
                return (
                  <TableRow key={route.path}>
                    <TableCell className="font-mono text-xs">
                      <Link href={editorHref(route.path)} className="no-underline hover:underline">
                        {route.path}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal">{route.label}</TableCell>
                    <TableCell className="text-xs whitespace-normal text-muted-foreground">
                      {row ? (
                        row.isActive ? (
                          overrideSummary(row).join(", ") || "row with no fields set"
                        ) : (
                          <span className="text-warning">saved but inactive</span>
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <BoolBadge value={route.indexable} on="Indexable" off="Noindex" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel
        className="mt-6"
        title="Other overrides"
        description="Geo pages, articles and glob rules."
        bodyClassName="p-0"
      >
        {extra.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No other overrides yet"
              hint="Open a geo route above to add one, or use a glob such as /vastu-consultant/united-arab-emirates/* to cover a whole branch."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Pattern</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Fields set</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extra.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={editorHref(row.routePattern)}
                        className="no-underline hover:underline"
                      >
                        {row.routePattern}
                      </Link>
                    </TableCell>
                    <TableCell>{isGlobPattern(row.routePattern) ? "Pattern" : "Exact"}</TableCell>
                    <TableCell className="text-xs whitespace-normal text-muted-foreground">
                      {overrideSummary(row).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <BoolBadge value={row.isActive} on="Active" off="Off" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent-border/40 bg-card px-4 py-3">
      <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
