/**
 * `/admin/aeo` — answer-engine optimisation (CLAUDE.md §9): the answer-block overrides with
 * the self-containment linter, the key-facts editor, the llms.txt / llms-full.txt composition,
 * the /for-ai additions, the per-crawler robots toggles with their retrieval-vs-training note,
 * and a citability check for any page.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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
import { AnswerLinter } from "@/components/admin/seo/answer-linter";
import { CitabilityBadge } from "@/components/admin/seo/citability-badge";
import { CitabilityChecklist } from "@/components/admin/seo/citability-checks";
import { SeoNav } from "@/components/admin/seo/seo-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminSession } from "@/lib/admin/auth";
import { internalOrigin } from "@/lib/markdown/fetch-page";
import { AI_BOT_GROUPS, getRobotsConfig, type BotPurpose } from "@/lib/robots-config";
import { listIndexableCoreRoutes } from "@/lib/routes";
import { KEY_FACTS_ID, listPageAnswers } from "@/lib/seo/aeo-data";
import { scoreCitability } from "@/lib/seo/citability";
import {
  getForAiDocument,
  getLlmsDocument,
  type ForAiDocumentConfig,
  type LlmsDocumentConfig,
} from "@/lib/seo/documents";
import { fetchHeadPreview } from "@/lib/seo/head-preview";

export const metadata: Metadata = { title: "AEO" };
export const dynamic = "force-dynamic";

/** Plain language for the owner: what allowing each crawler actually permits. */
const PURPOSE_NOTE: Record<BotPurpose, string> = {
  retrieval:
    "Retrieval only — it fetches a page to answer a question now, and can cite the site. Allowing it is how the practice gets quoted.",
  training:
    "Training — content it fetches may be used to train future models. That is how the brand becomes known to models, but it is a business decision.",
  "retrieval+training":
    "Both — it answers questions live and its content may also be used for training. Allowing it maximises visibility; disallowing loses the citations too.",
  search:
    "Classic search index. Bing matters more than usual here: ChatGPT's search leans on it. Keep it allowed.",
};

export default async function AeoPage({ searchParams }: PageProps<"/admin/aeo">) {
  const params = await searchParams;
  const checkRoute =
    typeof params.check === "string" && params.check.startsWith("/") ? params.check : null;
  const db = getDb();
  const [session, answers, llms, forAi, robots] = await Promise.all([
    getAdminSession(),
    listPageAnswers(db),
    getLlmsDocument(),
    getForAiDocument(),
    getRobotsConfig(),
  ]);
  const canEdit = session?.adminUser.role !== "viewer" && Boolean(db);
  const isOwner = session?.adminUser.role === "owner" && Boolean(db);

  const citability = checkRoute
    ? await fetchHeadPreview(internalOrigin(await headers()), checkRoute).then((preview) =>
        preview.status === 200 ? scoreCitability(preview.html) : null,
      )
    : null;

  const llmsConfig: LlmsDocumentConfig = llms ?? {};
  const forAiConfig: ForAiDocumentConfig = forAi ?? {};
  const keyFactRows = answers.filter((a) => a.h2Id === KEY_FACTS_ID);
  const answerRows = answers.filter((a) => a.h2Id !== KEY_FACTS_ID);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Answer-engine optimisation"
        description="How ChatGPT, Gemini, Claude, Perplexity and Siri read this site: self-contained answers, key facts, the machine-readable documents and which crawlers may fetch them."
      />
      <SeoNav current="/admin/aeo" />
      {!db ? <OfflineNote what="AEO settings" /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Answer blocks"
            description="A 40–60 word answer directly under a question H2, written to make sense quoted on its own (§9.2)."
          >
            <ActionForm
              action="/api/admin/aeo/answers"
              submitLabel="Save answer"
              disabled={!canEdit}
              successMessage="Saved. The page shows the override on its next request."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Route"
                  htmlFor="route"
                  hint="Exact route — answers are page-specific."
                >
                  <Input
                    id="route"
                    name="route"
                    required
                    placeholder="/astrologer/india/maharashtra/mumbai"
                    spellCheck={false}
                  />
                </Field>
                <Field
                  label="Heading id"
                  htmlFor="h2Id"
                  hint={`The H2's id attribute, or "${KEY_FACTS_ID}" for the key-facts block.`}
                >
                  <Input id="h2Id" name="h2Id" required placeholder="how-much-does-it-cost" />
                </Field>
              </div>
              <Field
                label="Answer"
                hint="Name the subject explicitly — never start with It / This / They."
              >
                <AnswerLinter name="answer" />
              </Field>
              <Field
                label="Key facts"
                htmlFor="keyFacts"
                hint="One per line as “Label | Value”. Used for the key-facts block; leave empty for a plain answer."
              >
                <Textarea
                  id="keyFacts"
                  name="keyFacts"
                  rows={4}
                  placeholder={"Session length | 90 minutes\nLanguages | English, Hindi"}
                />
              </Field>
            </ActionForm>
          </Panel>

          <Panel
            title="Saved answer overrides"
            description={`${answerRows.length} answer${answerRows.length === 1 ? "" : "s"} and ${keyFactRows.length} key-facts block${keyFactRows.length === 1 ? "" : "s"}.`}
          >
            {answers.length === 0 ? (
              <EmptyState
                title="No overrides"
                hint="Pages render the answers written into the content until one is saved here."
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {answers.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.route} · {row.h2Id}
                      </p>
                      {row.answer ? <p className="mt-1 text-sm">{row.answer}</p> : null}
                      {row.keyFacts?.length ? (
                        <dl className="mt-1 text-xs text-muted-foreground">
                          {row.keyFacts.map((fact) => (
                            <div key={fact.label} className="flex gap-2">
                              <dt className="font-medium">{fact.label}:</dt>
                              <dd>{fact.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                    <ActionForm
                      action={`/api/admin/aeo/answers/${row.id}`}
                      method="DELETE"
                      inline
                      size="xs"
                      variant="destructive"
                      submitLabel="Remove"
                      confirm={`Remove the override for ${row.h2Id} on ${row.route}?`}
                      disabled={!canEdit}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="llms.txt and llms-full.txt"
            description="The structured index and the full-text bundle served at /llms.txt and /llms-full.txt (§9.5)."
            actions={
              <Button asChild variant="outline" size="sm">
                <a href="/llms.txt" target="_blank" rel="noreferrer">
                  View
                </a>
              </Button>
            }
          >
            <ActionForm
              action="/api/admin/aeo/llms"
              submitLabel="Save composition"
              disabled={!canEdit}
            >
              <Field
                label="Preamble"
                htmlFor="preamble"
                hint="Replaces the generated summary quote at the top. Plain declarative prose reads best to a model."
              >
                <Textarea
                  id="preamble"
                  name="preamble"
                  rows={4}
                  defaultValue={llmsConfig.preamble ?? ""}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Exclude paths" htmlFor="excludePaths" hint="One per line.">
                  <Textarea
                    id="excludePaths"
                    name="excludePaths"
                    rows={4}
                    spellCheck={false}
                    defaultValue={(llmsConfig.excludePaths ?? []).join("\n")}
                  />
                </Field>
                <Field label="Extra paths" htmlFor="extraPaths" hint="Must exist and be indexable.">
                  <Textarea
                    id="extraPaths"
                    name="extraPaths"
                    rows={4}
                    spellCheck={false}
                    defaultValue={(llmsConfig.extraPaths ?? []).join("\n")}
                  />
                </Field>
              </div>
              <Field
                label="Order"
                htmlFor="order"
                hint="Paths listed here come first, in this order; everything else follows in registry order."
              >
                <Textarea
                  id="order"
                  name="order"
                  rows={3}
                  spellCheck={false}
                  defaultValue={(llmsConfig.order ?? []).join("\n")}
                  placeholder={listIndexableCoreRoutes()
                    .slice(0, 3)
                    .map((r) => r.path)
                    .join("\n")}
                />
              </Field>
              <CheckboxField
                name="includeCountryGeo"
                label="Include country pages in llms-full.txt"
                defaultChecked={llmsConfig.includeCountryGeo !== false}
              />
            </ActionForm>
          </Panel>

          <Panel
            title="/for-ai page"
            description="The plain, factual summary written for machines (§9.11). Additions are appended to the generated page."
            actions={
              <Button asChild variant="outline" size="sm">
                <a href="/for-ai" target="_blank" rel="noreferrer">
                  View
                </a>
              </Button>
            }
          >
            <ActionForm
              action="/api/admin/aeo/for-ai"
              submitLabel="Save /for-ai"
              disabled={!canEdit}
            >
              <Field
                label="Intro paragraph"
                htmlFor="intro"
                hint="Replaces the generated entity paragraph: who she is, what she practises, where, what makes the method distinct — no marketing language."
              >
                <Textarea id="intro" name="intro" rows={4} defaultValue={forAiConfig.intro ?? ""} />
              </Field>
              <Field
                label="Extra key facts"
                htmlFor="extraFacts"
                hint="“Label | Value” per line. Only facts the practitioner can stand behind (CLAUDE.md §12)."
              >
                <Textarea
                  id="extraFacts"
                  name="extraFacts"
                  rows={4}
                  defaultValue={(forAiConfig.extraFacts ?? [])
                    .map((f) => `${f.label} | ${f.value}`)
                    .join("\n")}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="What the practice does not claim" htmlFor="extraLimits">
                  <Textarea
                    id="extraLimits"
                    name="extraLimits"
                    rows={4}
                    defaultValue={(forAiConfig.extraLimits ?? []).join("\n")}
                  />
                </Field>
                <Field label="What to bring to a consultation" htmlFor="extraBring">
                  <Textarea
                    id="extraBring"
                    name="extraBring"
                    rows={4}
                    defaultValue={(forAiConfig.extraBring ?? []).join("\n")}
                  />
                </Field>
              </div>
            </ActionForm>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Citability check"
            description="Scores a page on what an assistant needs in order to quote it."
            actions={citability ? <CitabilityBadge score={citability.score} /> : null}
          >
            <form method="get" action="/admin/aeo" className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Route" htmlFor="check" className="flex-1">
                <Input
                  id="check"
                  name="check"
                  defaultValue={checkRoute ?? "/"}
                  spellCheck={false}
                  list="aeo-routes"
                />
              </Field>
              <datalist id="aeo-routes">
                {listIndexableCoreRoutes().map((r) => (
                  <option key={r.path} value={r.path} />
                ))}
              </datalist>
              <button
                type="submit"
                className="h-9 rounded-md border border-input px-3 text-sm shadow-xs"
              >
                Check
              </button>
            </form>
            {!checkRoute ? (
              <p className="text-sm text-muted-foreground">
                Pick a route to score it. The same score is shown on each page&rsquo;s SEO editor.
              </p>
            ) : citability ? (
              <>
                <CitabilityChecklist result={citability} />
                <p className="mt-3 text-xs">
                  <Link
                    href={`/admin/seo${checkRoute === "/" ? "/index" : checkRoute}`}
                    className="no-underline hover:underline"
                  >
                    Open the SEO editor for {checkRoute} →
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-warning">
                {checkRoute} could not be fetched from this server, so it could not be scored.
              </p>
            )}
          </Panel>

          <Panel
            title="AI crawlers"
            description="robots.txt gives every crawler its own group. Read the note before disallowing one — most of them are how the site gets cited."
            actions={
              <Button asChild variant="outline" size="sm">
                <a href="/robots.txt" target="_blank" rel="noreferrer">
                  robots.txt
                </a>
              </Button>
            }
          >
            {!isOwner ? (
              <p className="mb-4 rounded-md border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                Only an owner can change crawler access.
              </p>
            ) : null}
            <ul className="divide-y divide-border/70">
              {AI_BOT_GROUPS.map((bot) => {
                const current = robots.bots.find((b) => b.userAgent === bot.userAgent) ?? bot;
                return (
                  <li key={bot.userAgent} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-mono text-sm">{bot.userAgent}</p>
                      <p className="text-xs text-muted-foreground">{bot.vendor}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PURPOSE_NOTE[bot.purpose]}
                    </p>
                    <ActionForm
                      action="/api/admin/aeo/bots"
                      className="mt-2"
                      inline
                      size="xs"
                      variant={current.enabled ? "outline" : "gold"}
                      submitLabel={current.enabled ? "Disallow" : "Allow"}
                      disabled={!isOwner}
                      confirm={
                        current.enabled
                          ? `Disallow ${bot.userAgent}? ${bot.purpose === "training" ? "Its training use stops; it cannot cite the site either." : "The site can no longer be cited by it."}`
                          : undefined
                      }
                      payload={{ agent: bot.userAgent, allow: current.enabled ? "off" : "on" }}
                    />
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Answer-block rules (§9.2)">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Every H2 on a content or geo page is a real question someone would type or say.
              </li>
              <li>
                Directly under it, before any elaboration, a 40–60 word answer in{" "}
                <code>&lt;p class=&quot;answer&quot;&gt;</code>.
              </li>
              <li>
                Self-contained: it names its subject (&ldquo;A vastu consultation for a Dubai
                apartment with Astrologer Kavita…&rdquo;), never &ldquo;It typically costs…&rdquo;.
              </li>
              <li>Never promise an outcome — the linter refuses guarantees and cure claims.</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Heading ids are visible in the page source, or in the &ldquo;Rendered head&rdquo;
              panel of each page&rsquo;s{" "}
              <Link href="/admin/seo" className="no-underline hover:underline">
                SEO editor
              </Link>
              .
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
