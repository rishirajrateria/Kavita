/**
 * `/admin/sitemaps` — which sitemaps are published and what is in them. Sections can be
 * switched off, individual pages excluded or given a priority / change frequency, and every
 * file can be previewed as the exact XML the crawler receives.
 */
import type { Metadata } from "next";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import {
  CheckboxField,
  EmptyState,
  Field,
  OfflineNote,
  Panel,
} from "@/components/admin/manage/panel";
import { BoolBadge } from "@/components/admin/manage/status-badge";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { SEARCH_TOOLS_NAV } from "@/components/admin/redirects/nav";
import { selectClass } from "@/components/admin/redirects/redirect-fields";
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
import { getAdminSession } from "@/lib/admin/auth";
import { getSitemapConfig, SITEMAP_SECTIONS } from "@/lib/redirects/sitemap-config";
import { sitemapSectionEntries } from "@/lib/sitemaps";

export const metadata: Metadata = { title: "Sitemaps" };
export const dynamic = "force-dynamic";

const CHANGEFREQ = [
  "",
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const;

export default async function SitemapsPage() {
  const db = getDb();
  const [config, session] = await Promise.all([getSitemapConfig(), getAdminSession()]);
  const canEdit = session?.adminUser.role !== "viewer";
  const sections = await Promise.all(
    SITEMAP_SECTIONS.map(async (s) => ({
      ...s,
      config: config[s.key],
      urls: (await sitemapSectionEntries(s.key)).length,
      overrides: Object.entries(config[s.key].perPage),
    })),
  );
  const overrides = sections.flatMap((s) =>
    s.overrides.map(([path, o]) => ({ section: s.key, label: s.label, path, override: o })),
  );
  const published = sections.filter((s) => s.config.included).length;
  const totalUrls = sections.reduce((n, s) => n + (s.config.included ? s.urls : 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Sitemaps"
        description="The index at /sitemap.xml lists every published section. lastmod comes from real content dates, never from the clock (CLAUDE.md §8)."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/sitemaps/preview?section=index" target="_blank" rel="noreferrer">
              Preview index XML
            </a>
          </Button>
        }
      />
      <SubNav items={SEARCH_TOOLS_NAV} current="/admin/sitemaps" label="Search tools" />
      {!db ? <OfflineNote what="Sitemap settings" /> : null}

      <dl className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Sections published" value={`${published} of ${sections.length}`} />
        <Stat label="URLs listed" value={totalUrls.toLocaleString("en")} />
        <Stat label="Page overrides" value={String(overrides.length)} />
      </dl>

      <Table containerClassName="rounded-lg border border-border">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Sitemap</TableHead>
            <TableHead className="text-right">URLs</TableHead>
            <TableHead className="hidden md:table-cell">Overrides</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((s, i) => (
            <TableRow key={s.key} className={i % 2 ? "bg-muted/20" : undefined}>
              <TableCell className="whitespace-normal">
                <span className="block font-medium">{s.label}</span>
                <span className="block font-mono text-xs text-muted-foreground">{s.file}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {s.config.included ? s.urls.toLocaleString("en") : "—"}
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                {s.overrides.length || "—"}
              </TableCell>
              <TableCell>
                <BoolBadge value={s.config.included} on="Published" off="Excluded" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button asChild variant="outline" size="xs">
                    <a
                      href={`/api/admin/sitemaps/preview?section=${s.key}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </a>
                  </Button>
                  {canEdit ? (
                    <ActionForm
                      action="/api/admin/sitemaps"
                      method="PATCH"
                      inline
                      size="xs"
                      variant={s.config.included ? "ghost" : "gold-outline"}
                      submitLabel={s.config.included ? "Exclude" : "Publish"}
                      disabled={!db}
                      payload={{ section: s.key, included: !s.config.included }}
                      successMessage="Saved. Sitemaps are cached for an hour before crawlers see the change."
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel
          title="Override one page"
          description="Exclude a single URL, or give it a priority (0–1) and change frequency. Leave a field empty to keep the default."
        >
          <ActionForm
            action="/api/admin/sitemaps"
            method="PATCH"
            submitLabel="Save override"
            disabled={!db || !canEdit}
            successMessage="Override saved."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sitemap" htmlFor="ov-section">
                <select id="ov-section" name="section" className={selectClass} defaultValue="pages">
                  {SITEMAP_SECTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Path"
                htmlFor="ov-path"
                hint="Site-relative, e.g. /services/kundli-reading"
              >
                <Input id="ov-path" name="path" placeholder="/about" required spellCheck={false} />
              </Field>
              <Field label="Priority" htmlFor="ov-priority" hint="0.0 – 1.0">
                <Input
                  id="ov-priority"
                  name="priority"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.8"
                />
              </Field>
              <Field label="Change frequency" htmlFor="ov-freq">
                <select id="ov-freq" name="changeFrequency" className={selectClass} defaultValue="">
                  {CHANGEFREQ.map((f) => (
                    <option key={f || "default"} value={f}>
                      {f || "Leave as it is"}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-wrap gap-6 md:col-span-2">
                <CheckboxField
                  name="pageIncluded"
                  label="Keep this page in the sitemap"
                  hint="Clear it to drop this one URL from the file."
                  defaultChecked
                />
              </div>
            </div>
          </ActionForm>
        </Panel>

        <Panel
          title="Current page overrides"
          description="Every URL that differs from the defaults."
        >
          {overrides.length === 0 ? (
            <EmptyState
              title="No page overrides"
              hint="Every URL is published with the priority and change frequency its section sets."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {overrides.map((o) => (
                <li
                  key={`${o.section}:${o.path}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-xs break-all">{o.path}</span>
                    <span className="block text-xs text-muted-foreground">
                      {o.label} ·{" "}
                      {o.override.included === false
                        ? "excluded"
                        : [
                            o.override.priority !== undefined
                              ? `priority ${o.override.priority}`
                              : null,
                            o.override.changeFrequency ?? null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "no change"}
                    </span>
                  </span>
                  {canEdit ? (
                    <ActionForm
                      action="/api/admin/sitemaps"
                      method="PATCH"
                      inline
                      size="xs"
                      variant="ghost"
                      submitLabel="Clear"
                      disabled={!db}
                      payload={{ section: o.section, path: o.path, clear: true }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent-border/40 bg-card px-5 py-4 shadow-xs">
      <dt className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-2xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}
