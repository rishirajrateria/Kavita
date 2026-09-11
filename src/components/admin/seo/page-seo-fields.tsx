/**
 * The `page_seo` override fields (Phase 6 P6-A), server-rendered inside the `ActionForm`
 * island on `/admin/seo/[...route]`. Field names match `pageSeoSchema`; the title and meta
 * description carry the ids the SERP mockup listens to (`#title`, `#metaDescription`).
 */
import { CheckboxField, Field } from "@/components/admin/manage/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OG_TYPES, ROBOTS_IMAGE_PREVIEWS, TWITTER_CARDS, type PageSeoRow } from "@/db/schema/seo";
import { DESCRIPTION_MAX_CHARS, TITLE_MAX_CHARS } from "@/lib/seo/keyword-check";

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30";

const TRI = [
  { value: "", label: "Leave as the page sets it" },
  { value: "on", label: "Yes" },
  { value: "off", label: "No" },
];

function hreflangText(row: PageSeoRow | null): string {
  return Object.entries(row?.hreflang ?? {})
    .map(([code, url]) => `${code} ${url}`)
    .join("\n");
}

/** A `<select>` whose empty option means "no override". */
function TriField({
  name,
  label,
  value,
  hint,
}: {
  name: string;
  label: string;
  value: boolean | undefined;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <select
        id={name}
        name={name}
        defaultValue={value === undefined ? "" : value ? "on" : "off"}
        className={selectClass}
      >
        {TRI.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function PageSeoFields({
  row,
  routePattern,
  lockPattern,
}: {
  row: PageSeoRow | null;
  routePattern: string;
  /** The editor edits one route; the pattern is shown read-only and posted as a hidden field. */
  lockPattern?: boolean;
}) {
  const robots = row?.robots ?? {};
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        <h3 className="font-serif text-base font-medium md:col-span-2">Search result</h3>
        {lockPattern ? (
          <input type="hidden" name="routePattern" value={routePattern} />
        ) : (
          <Field
            label="Route pattern"
            htmlFor="routePattern"
            hint="Exact route (/about) or a glob (/astrologer/india/*). Exact wins over the longest glob."
            className="md:col-span-2"
          >
            <Input
              id="routePattern"
              name="routePattern"
              defaultValue={routePattern}
              required
              spellCheck={false}
            />
          </Field>
        )}
        <Field
          label="Title"
          htmlFor="title"
          hint={`Replaces the page's own <title>. Aim for ${TITLE_MAX_CHARS} characters or fewer.`}
          className="md:col-span-2"
        >
          <Input
            id="title"
            name="title"
            defaultValue={row?.title ?? ""}
            maxLength={120}
            placeholder="Astrologer in Mumbai | Vedic Astrology & Vastu — Astrologer Kavita"
          />
        </Field>
        <Field
          label="Meta description"
          htmlFor="metaDescription"
          hint={`150–${DESCRIPTION_MAX_CHARS} characters, written to earn the click, with the location and a differentiator.`}
          className="md:col-span-2"
        >
          <Textarea
            id="metaDescription"
            name="metaDescription"
            rows={3}
            defaultValue={row?.metaDescription ?? ""}
            maxLength={320}
          />
        </Field>
        <Field
          label="H1 override"
          htmlFor="h1Override"
          hint="Rarely needed; the page's H1 otherwise."
        >
          <Input
            id="h1Override"
            name="h1Override"
            defaultValue={row?.h1Override ?? ""}
            maxLength={200}
          />
        </Field>
        <Field
          label="Primary keyword"
          htmlFor="keywordFocus"
          hint="One keyword per page — the checklist below is measured against it."
        >
          <Input
            id="keywordFocus"
            name="keywordFocus"
            defaultValue={row?.keywordFocus ?? ""}
            maxLength={120}
            placeholder="astrologer in Mumbai"
          />
        </Field>
        <Field
          label="Canonical URL"
          htmlFor="canonicalUrl"
          hint="Absolute URL. Leave empty to keep the page's self-referencing canonical."
          className="md:col-span-2"
        >
          <Input
            id="canonicalUrl"
            name="canonicalUrl"
            type="url"
            defaultValue={row?.canonicalUrl ?? ""}
            placeholder="https://…"
            spellCheck={false}
          />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h3 className="font-serif text-base font-medium md:col-span-2">Robots</h3>
        <TriField name="robotsIndex" label="Index this page" value={robots.index} />
        <TriField name="robotsFollow" label="Follow its links" value={robots.follow} />
        <Field
          label="Max snippet"
          htmlFor="maxSnippet"
          hint="Characters a search engine may quote. -1 = no limit; empty = no directive."
        >
          <Input
            id="maxSnippet"
            name="maxSnippet"
            type="number"
            min={-1}
            max={10000}
            defaultValue={robots.maxSnippet ?? ""}
          />
        </Field>
        <Field label="Max image preview" htmlFor="maxImagePreview">
          <select
            id="maxImagePreview"
            name="maxImagePreview"
            defaultValue={robots.maxImagePreview ?? ""}
            className={selectClass}
          >
            <option value="">No directive</option>
            {ROBOTS_IMAGE_PREVIEWS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-wrap gap-6 md:col-span-2">
          <CheckboxField
            name="noarchive"
            label="noarchive"
            hint="No cached copy."
            defaultChecked={robots.noarchive ?? false}
          />
          <CheckboxField
            name="nosnippet"
            label="nosnippet"
            hint="No text snippet at all."
            defaultChecked={robots.nosnippet ?? false}
          />
          <CheckboxField
            name="isActive"
            label="Override active"
            hint="Off keeps the row but the page renders its own metadata."
            defaultChecked={row?.isActive ?? true}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h3 className="font-serif text-base font-medium md:col-span-2">Social</h3>
        <Field label="OG title" htmlFor="ogTitle">
          <Input id="ogTitle" name="ogTitle" defaultValue={row?.ogTitle ?? ""} maxLength={200} />
        </Field>
        <Field label="OG type" htmlFor="ogType">
          <select
            id="ogType"
            name="ogType"
            defaultValue={row?.ogType ?? ""}
            className={selectClass}
          >
            <option value="">Page default</option>
            {OG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="OG description" htmlFor="ogDescription" className="md:col-span-2">
          <Textarea
            id="ogDescription"
            name="ogDescription"
            rows={2}
            defaultValue={row?.ogDescription ?? ""}
            maxLength={400}
          />
        </Field>
        <Field
          label="OG image URL"
          htmlFor="ogImageUrl"
          hint="Paste a library image URL, or leave empty to use the generated image."
          className="md:col-span-2"
        >
          <Input
            id="ogImageUrl"
            name="ogImageUrl"
            defaultValue={row?.ogImageUrl ?? ""}
            spellCheck={false}
            placeholder="https://…/og-library/…png"
          />
        </Field>
        <Field
          label="Generated image text"
          htmlFor="ogText"
          hint="Used when there is no image URL: this text is drawn on /api/og."
          className="md:col-span-2"
        >
          <Input id="ogText" name="ogText" defaultValue={row?.ogText ?? ""} maxLength={90} />
        </Field>
        <Field label="Twitter card" htmlFor="twitterCard">
          <select
            id="twitterCard"
            name="twitterCard"
            defaultValue={row?.twitterCard ?? ""}
            className={selectClass}
          >
            <option value="">Page default</option>
            {TWITTER_CARDS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Twitter image URL" htmlFor="twitterImageUrl">
          <Input
            id="twitterImageUrl"
            name="twitterImageUrl"
            defaultValue={row?.twitterImageUrl ?? ""}
            spellCheck={false}
          />
        </Field>
        <Field label="Twitter title" htmlFor="twitterTitle">
          <Input
            id="twitterTitle"
            name="twitterTitle"
            defaultValue={row?.twitterTitle ?? ""}
            maxLength={200}
          />
        </Field>
        <Field label="Twitter description" htmlFor="twitterDescription">
          <Input
            id="twitterDescription"
            name="twitterDescription"
            defaultValue={row?.twitterDescription ?? ""}
            maxLength={400}
          />
        </Field>
      </section>

      <section className="grid gap-4">
        <h3 className="font-serif text-base font-medium">hreflang and custom head</h3>
        <Field
          label="hreflang cluster"
          htmlFor="hreflang"
          hint="One per line: “en-IN https://…”. Country pages must list every sibling plus x-default, reciprocally (CLAUDE.md §8)."
        >
          <Textarea
            id="hreflang"
            name="hreflang"
            rows={5}
            spellCheck={false}
            defaultValue={hreflangText(row)}
            placeholder={
              "en-IN https://example.com/astrologer/india\nx-default https://example.com/astrologer/india"
            }
          />
        </Field>
        <Field
          label="Custom head HTML"
          htmlFor="customHeadHtml"
          hint='Sanitised on save: only <meta>, <link> and <script type="application/ld+json"> survive; anything else (and every on* attribute) is stripped and reported.'
        >
          <Textarea
            id="customHeadHtml"
            name="customHeadHtml"
            rows={6}
            spellCheck={false}
            className="font-mono text-xs"
            defaultValue={row?.customHeadHtml ?? ""}
          />
        </Field>
        <Field
          label="Extra JSON-LD"
          htmlFor="structuredDataOverrides"
          hint="A JSON object merged into the page's graph as its own script block."
        >
          <Textarea
            id="structuredDataOverrides"
            name="structuredDataOverrides"
            rows={4}
            spellCheck={false}
            className="font-mono text-xs"
            defaultValue={
              row?.structuredDataOverrides
                ? JSON.stringify(row.structuredDataOverrides, null, 2)
                : ""
            }
          />
        </Field>
      </section>
    </div>
  );
}
