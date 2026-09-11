import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { RESEARCH_STATUSES } from "@/content/locations/schema";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Panel } from "@/components/admin/manage/panel";
import { BoolBadge, ResearchStatusBadge } from "@/components/admin/manage/status-badge";
import { CONTENT_NAV, SubNav } from "@/components/admin/manage/sub-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listLocationsAdmin } from "@/lib/admin/content";

export const metadata: Metadata = { title: "Locations" };
export const dynamic = "force-dynamic";

export default async function LocationsPage({
  searchParams,
}: PageProps<"/admin/content/locations">) {
  const params = await searchParams;
  const db = getDb();
  const all = await listLocationsAdmin(db);
  const status =
    typeof params.status === "string" &&
    (RESEARCH_STATUSES as readonly string[]).includes(params.status)
      ? params.status
      : "";
  const type = typeof params.type === "string" ? params.type : "";
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const rows = all.filter(
    (l) =>
      (!status || l.researchStatus === status) &&
      (!type || l.type === type) &&
      (!q || l.name.toLowerCase().includes(q) || l.path.includes(q)),
  );
  const counts = { complete: 0, partial: 0, stub: 0 };
  for (const l of all) counts[l.researchStatus] += 1;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Locations"
        description={`${all.length} places in the geo tree · ${counts.complete} complete, ${counts.partial} partial, ${counts.stub} stubs. Only complete rows are indexed; stubs never render.`}
      />
      <SubNav items={CONTENT_NAV} current="/admin/content/locations" label="Content sections" />
      <Panel className="mb-6" bodyClassName="py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {db
            ? "Connected: database rows are authoritative for the live site. Editing here overrides the repository research files until `pnpm db:seed` re-imports them."
            : "Not connected: showing the repository research files (src/content/locations). Once Supabase is connected, rows in the database override these files and can be edited here."}
        </p>
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
            aria-label="Status"
          >
            <option value="">Any status</option>
            {RESEARCH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={type}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
            aria-label="Type"
          >
            <option value="">Any type</option>
            <option value="country">Countries</option>
            <option value="state">States / regions</option>
            <option value="city">Cities</option>
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or path"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
            aria-label="Search"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Filter
          </button>
        </form>
      </Panel>
      <Table containerClassName="rounded-lg border border-border">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Featured</TableHead>
            <TableHead className="hidden md:table-cell">Content date</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 400).map((l, i) => (
            <TableRow key={l.path} className={i % 2 ? "bg-muted/20" : undefined}>
              <TableCell>
                <Link
                  href={`/admin/content/locations/${l.path}`}
                  className="font-medium no-underline hover:underline"
                >
                  {l.name}
                </Link>
                <span className="block text-xs text-muted-foreground">{l.path}</span>
              </TableCell>
              <TableCell className="capitalize">{l.type}</TableCell>
              <TableCell>
                <ResearchStatusBadge status={l.researchStatus} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <BoolBadge value={l.isFeatured} on="Featured" off="—" />
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {l.contentUpdatedAt}
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                {l.id ? "database" : "repository"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 400 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the first 400; narrow the filter to see the rest.
        </p>
      ) : null}
    </>
  );
}
