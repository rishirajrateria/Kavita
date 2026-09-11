/**
 * `/admin/social` — the social card control: default OG/Twitter templates per content type,
 * the image library (Supabase Storage bucket `og-library`), and a preview of how any page's
 * link renders on WhatsApp, X, LinkedIn and Facebook. Per-page overrides live in each page's
 * SEO editor; the templates here fill in everything that has no override.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getDb } from "@/db";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { EmptyState, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { OgUploadForm } from "@/components/admin/seo/og-upload-form";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { SocialCardPreviews } from "@/components/admin/seo/social-cards";
import { Input } from "@/components/ui/input";
import { getAdminSession } from "@/lib/admin/auth";
import { internalOrigin } from "@/lib/markdown/fetch-page";
import { normalisePath } from "@/lib/routes";
import { OG_TEMPLATE_TYPES, getOgTemplates } from "@/lib/seo/documents";
import { fetchHeadPreview } from "@/lib/seo/head-preview";
import { contentTypeForRoute } from "@/lib/seo/page-seo";
import { listOgImages, OG_RECOMMENDED } from "@/lib/seo/og-library";
import { isStorageConfigured } from "@/lib/storage/supabase";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Social" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<(typeof OG_TEMPLATE_TYPES)[number], string> = {
  home: "Home page",
  geo: "Location pages",
  service: "Service pages",
  article: "Learn articles",
  glossary: "Glossary terms",
  page: "Everything else",
};

export default async function SocialPage({ searchParams }: PageProps<"/admin/social">) {
  const params = await searchParams;
  const route = normalisePath(typeof params.preview === "string" ? params.preview : "/");
  const db = getDb();
  const [session, templates, images, preview] = await Promise.all([
    getAdminSession(),
    getOgTemplates(),
    listOgImages(db),
    fetchHeadPreview(internalOrigin(await headers()), route),
  ]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  const storageReady = isStorageConfigured();
  const siteUrl = getSiteUrl();

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Social cards"
        description="What people see when a link to this site is pasted into a chat or a feed. Templates set the default per kind of page; a single page can still override everything in its own SEO editor."
      />
      <SeoNav current="/admin/social" />
      {!db ? <OfflineNote what="Templates and the image library" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Preview"
            description={`Rendered from ${route} as it is served right now (content type: ${contentTypeForRoute(route)}).`}
          >
            <form
              method="get"
              action="/admin/social"
              className="mb-6 flex flex-wrap items-end gap-2"
            >
              <Field label="Route" htmlFor="preview" className="flex-1">
                <Input id="preview" name="preview" defaultValue={route} spellCheck={false} />
              </Field>
              <button
                type="submit"
                className="h-9 rounded-md border border-input px-3 text-sm shadow-xs"
              >
                Preview
              </button>
            </form>
            {preview.status === 200 ? (
              <SocialCardPreviews
                data={{
                  url: `${siteUrl}${route === "/" ? "" : route}`,
                  title: preview.summary.ogTitle ?? preview.summary.title ?? route,
                  description: preview.summary.ogDescription ?? preview.summary.description ?? "",
                  imageUrl: preview.summary.ogImage ?? null,
                  imageAlt: `Social preview image for ${route}`,
                  twitterCard:
                    preview.summary.twitterCard === "summary" ? "summary" : "summary_large_image",
                }}
              />
            ) : (
              <p className="text-sm text-warning">
                {route} could not be fetched from this server (status {preview.status}), so there is
                nothing to preview.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Mockups are hand-built from each platform&rsquo;s own proportions — close, not
              pixel-exact, and no data is sent to any platform to produce them.
            </p>
          </Panel>

          <Panel
            title="Default templates"
            description="Applied before a page's own override. Tokens: {{title}}, {{description}}, {{brand}}. An empty field leaves the page's own value alone."
          >
            <ActionForm
              action="/api/admin/social/templates"
              submitLabel="Save templates"
              disabled={!canEdit}
            >
              <div className="flex min-w-0 flex-col gap-6">
                {OG_TEMPLATE_TYPES.map((type) => (
                  <div key={type} className="grid gap-3 md:grid-cols-2">
                    <h3 className="font-serif text-base font-medium md:col-span-2">
                      {TYPE_LABEL[type]}
                    </h3>
                    <Field label="Card title" htmlFor={`${type}_title`}>
                      <Input
                        id={`${type}_title`}
                        name={`${type}_title`}
                        defaultValue={templates?.[type]?.title ?? ""}
                        maxLength={200}
                        placeholder="{{title}} — {{brand}}"
                      />
                    </Field>
                    <Field label="Card description" htmlFor={`${type}_description`}>
                      <Input
                        id={`${type}_description`}
                        name={`${type}_description`}
                        defaultValue={templates?.[type]?.description ?? ""}
                        maxLength={400}
                        placeholder="{{description}}"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </ActionForm>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Image library"
            description={`${OG_RECOMMENDED.width}×${OG_RECOMMENDED.height} works everywhere. Paste an image's URL into a page's "OG image URL" field.`}
          >
            <OgUploadForm storageReady={storageReady} canEdit={canEdit} />
          </Panel>

          <Panel title={`Images (${images.length})`} bodyClassName={images.length ? "p-4" : "p-5"}>
            {images.length === 0 ? (
              <EmptyState
                title="Nothing uploaded yet"
                hint="Until an image is uploaded, every card uses the generated image from /api/og."
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {images.map((image) => {
                  const rightSize =
                    image.width === OG_RECOMMENDED.width && image.height === OG_RECOMMENDED.height;
                  return (
                    <li
                      key={image.id}
                      className="overflow-hidden rounded-lg border border-border/70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL */}
                      <img
                        src={image.publicUrl}
                        alt={image.alt}
                        className="aspect-[1200/630] w-full bg-muted object-cover"
                      />
                      <div className="space-y-2 px-3 py-2">
                        <p className="text-sm font-medium">{image.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {image.width && image.height
                            ? `${image.width}×${image.height}`
                            : "size unknown"}{" "}
                          · {Math.round(image.bytes / 1024)} KB
                          {rightSize ? "" : " · not 1200×630"}
                        </p>
                        <p className="font-mono text-[0.65rem] break-all text-muted-foreground">
                          {image.publicUrl}
                        </p>
                        <ActionForm
                          action={`/api/admin/og-library/${image.id}`}
                          method="DELETE"
                          inline
                          size="xs"
                          variant="destructive"
                          submitLabel="Delete"
                          confirm={`Delete “${image.label}”? Any page using its URL falls back to the generated image.`}
                          disabled={!canEdit}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Generated images">
            <p className="text-sm text-muted-foreground">
              With no image URL set, a page&rsquo;s card is drawn on demand at <code>/api/og</code>{" "}
              — ivory ground, gold frame, the page&rsquo;s title. Set{" "}
              <strong>Generated image text</strong> in a page&rsquo;s{" "}
              <Link href="/admin/seo" className="no-underline hover:underline">
                SEO editor
              </Link>{" "}
              to change what it says.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin generated image */}
            <img
              src="/api/og?title=Astrologer%20in%20Mumbai&kind=astrologer"
              alt="Example of the generated Open Graph image"
              className="mt-3 aspect-[1200/630] w-full rounded-md border border-border/70"
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
