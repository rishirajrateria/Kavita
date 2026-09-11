import type { Metadata } from "next";
import { INTEGRATIONS_NAV } from "@/components/admin/integrations/sub-nav";
import { ActionForm } from "@/components/admin/manage/action-form";
import { PageHeader } from "@/components/admin/manage/page-header";
import { CheckboxField, Field, OfflineNote, Panel } from "@/components/admin/manage/panel";
import { SubNav } from "@/components/admin/manage/sub-nav";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { getAdminSession } from "@/lib/admin/auth";
import { listVerificationTags } from "@/lib/integrations/verification";

/**
 * `/admin/integrations/verification` — search-engine site verification (CLAUDE.md §13B), both
 * supported methods and both admin-managed: a `<meta>` tag rendered into every page's head, or
 * the HTML/XML file the engine hands out, served at its root path by `/api/verify` with no
 * deploy. Only the file names the engines actually issue are accepted.
 */
export const metadata: Metadata = { title: "Verification" };
export const dynamic = "force-dynamic";

const META_PROVIDERS = [
  { provider: "google", label: "Google Search Console", metaName: "google-site-verification" },
  { provider: "bing", label: "Bing Webmaster Tools", metaName: "msvalidate.01" },
  { provider: "pinterest", label: "Pinterest", metaName: "p:domain_verify" },
  { provider: "yandex", label: "Yandex", metaName: "yandex-verification" },
] as const;

const FILE_PROVIDERS = [
  { provider: "google", label: "Google", placeholder: "/google1a2b3c4d5e6f7890.html" },
  { provider: "bing", label: "Bing", placeholder: "/BingSiteAuth.xml" },
  { provider: "pinterest", label: "Pinterest", placeholder: "/pinterest-1a2b3.html" },
] as const;

export default async function VerificationPage() {
  const db = getDb();
  const [session, tags] = await Promise.all([getAdminSession(), listVerificationTags()]);
  const canEdit = session?.adminUser.role === "owner" && Boolean(db ?? session.bypass);
  const find = (provider: string, kind: "meta" | "file") =>
    tags.find((t) => t.provider === provider && t.kind === kind) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Site verification"
        description="Proving to Google, Bing, Pinterest and Yandex that this site is yours. Use whichever method the engine offers you — a meta tag or a file — and paste it here; neither needs a developer or a deploy."
      />
      <SubNav
        items={INTEGRATIONS_NAV}
        current="/admin/integrations/verification"
        label="Integration sections"
      />
      {!db ? <OfflineNote /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Meta tags"
          description="Rendered in the <head> of every page. Paste only the content value, not the whole tag."
        >
          <div className="flex flex-col gap-6">
            {META_PROVIDERS.map((entry) => {
              const row = find(entry.provider, "meta");
              return (
                <ActionForm
                  key={entry.provider}
                  action="/api/admin/integrations/verification"
                  method="PATCH"
                  submitLabel={`Save ${entry.label}`}
                  size="sm"
                  disabled={!canEdit}
                  payload={{ provider: entry.provider, kind: "meta", metaName: entry.metaName }}
                  className="border-b border-border/70 pb-5 last:border-0 last:pb-0"
                >
                  <Field
                    label={entry.label}
                    htmlFor={`meta-${entry.provider}`}
                    hint={
                      <>
                        <code>{entry.metaName}</code>
                        {row?.isEnabled ? " · live on the site" : " · not yet live"}
                      </>
                    }
                  >
                    <Input
                      id={`meta-${entry.provider}`}
                      name="metaContent"
                      defaultValue={row?.metaContent ?? ""}
                      placeholder="paste the content value"
                      autoComplete="off"
                    />
                  </Field>
                  <CheckboxField
                    name="isEnabled"
                    label="Render this tag"
                    defaultChecked={row?.isEnabled ?? true}
                  />
                </ActionForm>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Verification files"
          description="Served at the exact path the engine asks for. Paste the file's contents; the path is checked against the names the engines issue."
        >
          <div className="flex flex-col gap-6">
            {FILE_PROVIDERS.map((entry) => {
              const row = find(entry.provider, "file");
              return (
                <ActionForm
                  key={entry.provider}
                  action="/api/admin/integrations/verification"
                  method="PATCH"
                  submitLabel={`Save ${entry.label} file`}
                  size="sm"
                  disabled={!canEdit}
                  payload={{ provider: entry.provider, kind: "file" }}
                  className="border-b border-border/70 pb-5 last:border-0 last:pb-0"
                >
                  <Field label={`${entry.label} — file path`} htmlFor={`path-${entry.provider}`}>
                    <Input
                      id={`path-${entry.provider}`}
                      name="filePath"
                      defaultValue={row?.filePath ?? ""}
                      placeholder={entry.placeholder}
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="File contents" htmlFor={`file-${entry.provider}`}>
                    <Textarea
                      id={`file-${entry.provider}`}
                      name="fileContent"
                      rows={3}
                      defaultValue={row?.fileContent ?? ""}
                    />
                  </Field>
                  <CheckboxField
                    name="isEnabled"
                    label="Serve this file"
                    defaultChecked={row?.isEnabled ?? true}
                  />
                  {row?.filePath ? (
                    <p className="text-xs text-muted-foreground">
                      Live at{" "}
                      <a href={row.filePath} target="_blank" rel="noopener">
                        {row.filePath}
                      </a>
                    </p>
                  ) : null}
                </ActionForm>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Currently active">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing verified yet. Start with Google Search Console — it is the one that matters
            most.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {tags.map((tag) => (
              <li key={tag.id} className="flex flex-wrap items-center gap-2">
                <Badge variant={tag.isEnabled ? "default" : "outline"}>
                  {tag.isEnabled ? "live" : "off"}
                </Badge>
                <span className="font-medium">{tag.provider}</span>
                <span className="text-muted-foreground">
                  {tag.kind === "meta" ? tag.metaName : tag.filePath}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
