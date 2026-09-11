/**
 * `/admin/seo/[...route]` — the per-page SEO editor. Segments are the route without its
 * leading slash (`/admin/seo/about`, `/admin/seo/astrologer/india`, `index` for the home
 * page); a `*` segment edits a glob rule. For a concrete route the page is fetched from this
 * same origin so the editor can show the exact rendered `<head>`, the citability score and the
 * §8 keyword checklist next to the fields that fix them.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { Fact, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { CitabilityBadge } from "@/components/admin/seo/citability-badge";
import { PageSeoFields } from "@/components/admin/seo/page-seo-fields";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { SerpPreview } from "@/components/admin/seo/serp-preview";
import { SocialCardPreviews } from "@/components/admin/seo/social-cards";
import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/admin/auth";
import { internalOrigin } from "@/lib/markdown/fetch-page";
import { normalisePath } from "@/lib/routes";
import { scoreCitability, type CitabilityResult } from "@/lib/seo/citability";
import { fetchHeadPreview, type HeadPreview } from "@/lib/seo/head-preview";
import { keywordChecklist, type KeywordChecklist } from "@/lib/seo/keyword-check";
import { getPageSeoByPattern } from "@/lib/seo/page-seo-admin";
import { ogImageForRow } from "@/lib/seo/page-seo";
import { isGlobPattern, normalisePattern } from "@/lib/seo/route-pattern";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function patternFromSegments(segments: string[]): string {
  if (segments.length === 1 && segments[0] === "index") return "/";
  const joined = `/${segments.map((s) => decodeURIComponent(s)).join("/")}`;
  return joined.includes("*") ? normalisePattern(joined) : normalisePath(joined);
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/seo/[...route]">): Promise<Metadata> {
  const { route } = await params;
  return { title: `SEO · ${patternFromSegments(route)}` };
}

export default async function PageSeoEditor({ params }: PageProps<"/admin/seo/[...route]">) {
  const { route } = await params;
  const pattern = patternFromSegments(route);
  const glob = isGlobPattern(pattern);
  const db = getDb();
  const [session, row] = await Promise.all([
    getAdminSession(),
    db ? getPageSeoByPattern(db, pattern) : Promise.resolve(null),
  ]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);

  let preview: HeadPreview | null = null;
  let citability: CitabilityResult | null = null;
  let checklist: KeywordChecklist | null = null;
  if (!glob) {
    preview = await fetchHeadPreview(internalOrigin(await headers()), pattern);
    if (preview.status === 200) {
      citability = scoreCitability(preview.html);
      checklist = keywordChecklist({
        html: preview.html,
        route: pattern,
        keyword: row?.keywordFocus,
        summary: preview.summary,
      });
    }
  }

  const siteUrl = getSiteUrl();
  const absolute = `${siteUrl}${pattern === "/" ? "" : pattern}`;
  const cardTitle =
    row?.ogTitle ?? row?.title ?? preview?.summary.ogTitle ?? preview?.summary.title ?? pattern;
  const cardDescription =
    row?.ogDescription ??
    row?.metaDescription ??
    preview?.summary.ogDescription ??
    preview?.summary.description ??
    "";
  const cardImage =
    (row ? ogImageForRow(row, siteUrl, pattern) : null) ?? preview?.summary.ogImage ?? null;

  return (
    <>
      <PageHeader
        eyebrow={glob ? "Pattern rule" : "Page"}
        title={pattern}
        description={
          glob
            ? "This rule applies to every route matching the pattern. An exact override for a single route always wins over it."
            : "Overrides are merged over what the page builds for itself: an empty field changes nothing."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/seo">All pages</Link>
            </Button>
            {!glob ? (
              <Button asChild variant="gold-outline" size="sm">
                <a href={pattern} target="_blank" rel="noreferrer">
                  View page
                </a>
              </Button>
            ) : null}
          </>
        }
      />
      <SeoNav current="/admin/seo" />
      {!db ? <OfflineNote what="Overrides" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Override"
            description={
              row
                ? `Saved ${row.updatedAt.toISOString().slice(0, 10)}.`
                : "No override saved for this route yet."
            }
          >
            <ActionForm
              action="/api/admin/page-seo"
              submitLabel={row ? "Save override" : "Create override"}
              disabled={!canEdit}
              successMessage="Saved. The page re-renders with the override on its next request."
            >
              <PageSeoFields row={row} routePattern={pattern} lockPattern />
            </ActionForm>
            {row && canEdit ? (
              <div className="mt-6 border-t border-border/70 pt-4">
                <ActionForm
                  action={`/api/admin/page-seo/${row.id}`}
                  method="DELETE"
                  variant="destructive"
                  size="sm"
                  inline
                  submitLabel="Delete override"
                  confirm="Delete this override? The page goes back to the metadata it builds for itself."
                  redirectTo="/admin/seo"
                  successMessage="Deleted."
                />
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Social cards"
            description="How the link renders when it is shared. WhatsApp first — it is where this audience shares."
          >
            <SocialCardPreviews
              data={{
                url: absolute,
                title: cardTitle,
                description: cardDescription,
                imageUrl: cardImage,
                imageAlt: `Preview image for ${pattern}`,
                twitterCard: row?.twitterCard ?? "summary_large_image",
              }}
            />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Search result" description="Updates as you type in the fields on the left.">
            <SerpPreview
              url={absolute}
              fallbackTitle={preview?.summary.title ?? "No title rendered"}
              fallbackDescription={preview?.summary.description ?? "No meta description rendered"}
              initialTitle={row?.title ?? null}
              initialDescription={row?.metaDescription ?? null}
            />
          </Panel>

          {glob ? (
            <Panel title="Live checks">
              <p className="text-sm text-muted-foreground">
                A pattern rule covers many URLs, so there is no single page to fetch. Open one of
                the routes it matches to see its rendered head, citability and keyword checklist.
              </p>
            </Panel>
          ) : preview?.status !== 200 ? (
            <Panel title="Live checks">
              <p className="text-sm text-warning">
                The page could not be fetched{preview ? ` (status ${preview.status})` : ""}. The
                rendered-head, citability and keyword checks need the page to return 200 from this
                same server.
              </p>
            </Panel>
          ) : (
            <>
              <Panel
                title="Citability"
                description="What an assistant needs to quote this page (CLAUDE.md §9)."
                actions={<CitabilityBadge score={citability?.score ?? null} />}
              >
                <ul className="space-y-1.5 text-sm">
                  {citability
                    ? (
                        [
                          ["Key facts block", citability.checks.keyFacts],
                          ["Question H2s", citability.checks.questionH2s],
                          ["Answer under each question", citability.checks.answersUnderH2s],
                          ["At least one table", citability.checks.table],
                          ["Visible date", citability.checks.dated],
                          ["Author byline", citability.checks.byline],
                          ["JSON-LD", citability.checks.jsonLd],
                        ] as const
                      ).map(([label, ok]) => (
                        <li key={label} className="flex items-start gap-2">
                          <span aria-hidden="true" className={ok ? "text-success" : "text-error"}>
                            {ok ? "✓" : "✗"}
                          </span>
                          <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
                        </li>
                      ))
                    : null}
                </ul>
                {citability && citability.fixes.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    {citability.fixes.map((fix) => (
                      <li key={fix} className="rounded-md border border-border/70 px-3 py-2">
                        {fix}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-4 text-xs text-muted-foreground">
                  {citability
                    ? `${citability.detail.wordCount} words · ${citability.detail.questionH2Count} of ${citability.detail.h2Count} H2s are questions · ${citability.detail.tableCount} tables.`
                    : null}{" "}
                  <Link href="/admin/aeo" className="no-underline hover:underline">
                    Fix answers in the AEO panel →
                  </Link>
                </p>
              </Panel>

              <Panel
                title="Keyword checklist"
                description={
                  checklist?.keyword
                    ? `Measured against “${checklist.keyword}”.`
                    : "Set a primary keyword to check the seven places §8 requires it."
                }
                actions={
                  checklist ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {checklist.passed}/{checklist.total}
                    </span>
                  ) : null
                }
              >
                <ul className="space-y-2 text-sm">
                  {checklist?.checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className={
                          check.ok
                            ? "text-success"
                            : check.severity === "error"
                              ? "text-error"
                              : "text-warning"
                        }
                      >
                        {check.ok ? "✓" : "✗"}
                      </span>
                      <span>
                        {check.label}
                        <span className="block text-xs text-muted-foreground">{check.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel
                title="Rendered head"
                description="Fetched from this server just now — exactly what a crawler receives."
                bodyClassName="p-0"
              >
                <dl className="divide-y divide-border/70 px-5 py-2">
                  <Fact label="Canonical">{preview.summary.canonical ?? "—"}</Fact>
                  <Fact label="Robots">{preview.summary.robots ?? "(default: index, follow)"}</Fact>
                  <Fact label="OG image">{preview.summary.ogImage ?? "—"}</Fact>
                  <Fact label="hreflang">
                    {Object.keys(preview.summary.hreflang).length
                      ? Object.entries(preview.summary.hreflang)
                          .map(([code, href]) => `${code} → ${href}`)
                          .join(" · ")
                      : "—"}
                  </Fact>
                  <Fact label="JSON-LD">
                    {preview.summary.jsonLdTypes.length
                      ? [...new Set(preview.summary.jsonLdTypes)].join(", ")
                      : "none"}
                  </Fact>
                </dl>
                <details className="border-t border-border/70 px-5 py-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    All {preview.entries.length} head tags
                  </summary>
                  <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-[0.7rem] leading-relaxed">
                    {preview.entries
                      .map((entry) =>
                        entry.tag === "title"
                          ? `<title>${entry.text}</title>`
                          : entry.tag === "script"
                            ? `<script type="application/ld+json">${(entry.text ?? "").slice(0, 400)}…</script>`
                            : `<${entry.tag} ${Object.entries(entry.attrs)
                                .map(([k, v]) => `${k}="${v}"`)
                                .join(" ")}>`,
                      )
                      .join("\n")}
                  </pre>
                </details>
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}
