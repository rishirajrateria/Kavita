/**
 * The redirect rule fields, shared by the create form (`/admin/redirects`) and the edit page
 * (`/admin/redirects/[id]`). Server-rendered inputs inside the `ActionForm` client island.
 */
import { CheckboxField, Field } from "@/components/admin/manage/panel";
import { Input } from "@/components/ui/input";
import { REDIRECT_MATCH_TYPES, REDIRECT_STATUSES } from "@/db/schema/redirects";

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs dark:bg-input/30";

const STATUS_LABELS: Record<number, string> = {
  301: "301 — moved permanently (default)",
  302: "302 — found (temporary)",
  307: "307 — temporary, keeps method",
  308: "308 — permanent, keeps method",
  410: "410 — gone (no destination)",
};

const MATCH_LABELS: Record<string, string> = {
  exact: "Exact path",
  wildcard: "Wildcard (* → $1)",
  regex: "Regular expression ($1…)",
};

export interface RedirectFieldValues {
  fromPath?: string;
  toPath?: string | null;
  matchType?: string;
  statusCode?: number;
  note?: string | null;
  isActive?: boolean;
}

export function RedirectFields({
  values = {},
  idPrefix = "r",
}: {
  values?: RedirectFieldValues;
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="Source path"
        htmlFor={id("fromPath")}
        hint="Exact: /old-page · wildcard: /old/* · regex: ^/old/(\d+)$ (anchored automatically, unsafe patterns refused)."
      >
        <Input
          id={id("fromPath")}
          name="fromPath"
          defaultValue={values.fromPath ?? ""}
          placeholder="/old-page"
          required
          spellCheck={false}
        />
      </Field>
      <Field
        label="Destination"
        htmlFor={id("toPath")}
        hint="A site path (/new-page, may use $1 or :splat) or a full https:// URL. Leave empty for 410."
      >
        <Input
          id={id("toPath")}
          name="toPath"
          defaultValue={values.toPath ?? ""}
          placeholder="/new-page"
          spellCheck={false}
        />
      </Field>
      <Field label="Match" htmlFor={id("matchType")}>
        <select
          id={id("matchType")}
          name="matchType"
          defaultValue={values.matchType ?? "exact"}
          className={selectClass}
        >
          {REDIRECT_MATCH_TYPES.map((m) => (
            <option key={m} value={m}>
              {MATCH_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status" htmlFor={id("statusCode")}>
        <select
          id={id("statusCode")}
          name="statusCode"
          defaultValue={String(values.statusCode ?? 301)}
          className={selectClass}
        >
          {REDIRECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note" htmlFor={id("note")} className="md:col-span-2">
        <Input
          id={id("note")}
          name="note"
          defaultValue={values.note ?? ""}
          placeholder="Why this redirect exists"
          maxLength={500}
        />
      </Field>
      <div className="flex flex-wrap gap-6 md:col-span-2">
        <CheckboxField name="isActive" label="Active" defaultChecked={values.isActive ?? true} />
        <CheckboxField
          name="collapseChain"
          label="Collapse chains"
          hint="If the destination is itself redirected, point straight at the final page."
          defaultChecked
        />
      </div>
    </div>
  );
}
