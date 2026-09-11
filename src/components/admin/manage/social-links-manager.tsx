"use client";

/**
 * Social-links manager (CLAUDE.md §13.A): add / edit / delete, drag-reorder with keyboard
 * alternative buttons, per-row toggles, per-platform URL validation (the same validator the
 * route runs), and a live preview of the footer row and the `sameAs` array the schema would
 * emit. Every change goes through `/api/admin/social-links/*`; the page refreshes after.
 */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SocialLink } from "@/db/schema";
import { SocialIcon, resolveSocialIcon } from "@/components/icons/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLATFORM_RULES,
  SOCIAL_PLATFORMS,
  detectPlatform,
  sameAsPreview,
  validateSocialUrl,
  type SocialPlatform,
} from "@/lib/admin/social-validators";
import { cn } from "@/lib/utils";

type Toggle = "isVisible" | "showInFooter" | "showInHeader" | "includeInSameas";
const TOGGLES: { key: Toggle; label: string }[] = [
  { key: "isVisible", label: "Visible" },
  { key: "showInFooter", label: "Footer" },
  { key: "showInHeader", label: "Header" },
  { key: "includeInSameas", label: "sameAs" },
];

async function api(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ ok: boolean; reason?: string; message?: string; errors?: Record<string, string[]> }> {
  try {
    const res = await fetch(path, {
      method,
      headers: { "content-type": "application/json", accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as {
      ok: boolean;
      reason?: string;
      message?: string;
      errors?: Record<string, string[]>;
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function SocialLinksManager({
  initial,
  disabled,
}: {
  initial: SocialLink[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => {
    const visible = [...links].filter((l) => l.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      footer: visible.filter((l) => l.showInFooter),
      header: visible.filter((l) => l.showInHeader),
      sameAs: sameAsPreview(links),
    };
  }, [links]);
  const ordered = useMemo(() => [...links].sort((a, b) => a.sortOrder - b.sortOrder), [links]);

  function report(
    res: { ok: boolean; reason?: string; message?: string; errors?: Record<string, string[]> },
    okText: string,
  ) {
    if (res.ok) {
      setError(null);
      setMessage(okText);
      router.refresh();
    } else {
      setMessage(null);
      const fields = res.errors
        ? " " +
          Object.entries(res.errors)
            .map(([k, v]) => `${k}: ${v.join(", ")}`)
            .join("; ")
        : "";
      setError(
        `${res.reason === "not_connected" ? "Not connected to Supabase — nothing saved." : (res.message ?? res.reason ?? "Failed")}${fields}`,
      );
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = ordered.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    await persistOrder(next);
  }

  async function persistOrder(next: SocialLink[]) {
    setLinks(next.map((l, i) => ({ ...l, sortOrder: (i + 1) * 10 })));
    if (disabled) return;
    report(
      await api("/api/admin/social-links/reorder", "POST", { ids: next.map((l) => l.id) }),
      "Order saved.",
    );
  }

  async function toggle(link: SocialLink, key: Toggle) {
    const value = !link[key];
    setLinks(links.map((l) => (l.id === link.id ? { ...l, [key]: value } : l)));
    if (disabled) return;
    report(await api(`/api/admin/social-links/${link.id}`, "PATCH", { [key]: value }), "Saved.");
  }

  async function remove(link: SocialLink) {
    if (!window.confirm(`Remove the ${PLATFORM_RULES[link.platform].label} link?`)) return;
    setLinks(links.filter((l) => l.id !== link.id));
    if (disabled) return;
    report(await api(`/api/admin/social-links/${link.id}`, "DELETE"), "Link removed.");
  }

  function onDrop(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const from = ordered.findIndex((l) => l.id === dragging);
    const to = ordered.findIndex((l) => l.id === targetId);
    const next = [...ordered];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setDragging(null);
    void persistOrder(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-accent-border/40 bg-card shadow-xs">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-serif text-lg font-medium tracking-tight">Links</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drag to reorder, or use the arrows. Toggles save immediately.
            </p>
          </div>
          <ol className="divide-y divide-border/70">
            {ordered.map((link, i) => (
              <li
                key={link.id}
                draggable={!disabled}
                onDragStart={() => setDragging(link.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(link.id)}
                onDragEnd={() => setDragging(null)}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center",
                  dragging === link.id && "opacity-50",
                )}
              >
                <div className="flex items-center gap-3 sm:w-1/2">
                  <span
                    aria-hidden="true"
                    className="cursor-grab text-muted-foreground select-none"
                  >
                    ⋮⋮
                  </span>
                  <span className="text-accent-strong">
                    <SocialIcon name={resolveSocialIcon(link.icon, link.platform)} size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{link.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
                  {TOGGLES.map((t) => (
                    <label key={t.key} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={link[t.key]}
                        disabled={disabled}
                        onChange={() => toggle(link, t.key)}
                        className="size-3.5 accent-[var(--accent-strong)]"
                      />
                      {t.label}
                    </label>
                  ))}
                  <span className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Move ${link.label} up`}
                      disabled={disabled || i === 0}
                      onClick={() => move(link.id, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Move ${link.label} down`}
                      disabled={disabled || i === ordered.length - 1}
                      onClick={() => move(link.id, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${link.label}`}
                      disabled={disabled}
                      onClick={() => remove(link)}
                      className="text-error"
                    >
                      ×
                    </Button>
                  </span>
                </div>
              </li>
            ))}
            {ordered.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No links yet.</li>
            ) : null}
          </ol>
        </section>
        <AddLinkForm disabled={disabled} onAdded={(res) => report(res, "Link added.")} />
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-xs",
            error ? "text-error" : "text-success",
            !error && !message && "sr-only",
          )}
        >
          {error ?? message ?? ""}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-accent-border/40 bg-card shadow-xs">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-serif text-lg font-medium tracking-tight">Footer preview</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Exactly what the footer&apos;s SocialLinks component renders.
            </p>
          </div>
          <div data-tone="inverse" className="bg-background px-5 py-6 text-foreground">
            {preview.footer.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing shown in the footer.</p>
            ) : (
              <ul className="flex flex-wrap items-center gap-1">
                {preview.footer.map((l) => (
                  <li key={l.id}>
                    <span
                      title={l.label}
                      className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground"
                    >
                      <SocialIcon name={resolveSocialIcon(l.icon, l.platform)} size={20} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {preview.header.length ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Header: {preview.header.map((l) => PLATFORM_RULES[l.platform].label).join(", ")}
              </p>
            ) : null}
          </div>
        </section>
        <section className="rounded-xl border border-accent-border/40 bg-card shadow-xs">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-serif text-lg font-medium tracking-tight">Resulting sameAs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Emitted on the Person and ProfessionalService schema. Hidden links, contact channels
              and placeholders are left out.
            </p>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed">
            {JSON.stringify({ sameAs: preview.sameAs }, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}

function AddLinkForm({
  disabled,
  onAdded,
}: {
  disabled?: boolean;
  onAdded: (res: {
    ok: boolean;
    reason?: string;
    message?: string;
    errors?: Record<string, string[]>;
  }) => void;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const check = url ? validateSocialUrl(platform, url) : null;
  const rule = PLATFORM_RULES[platform];

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-accent-border/40 bg-card p-5 shadow-xs"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!check?.ok) return;
        setBusy(true);
        const res = await api("/api/admin/social-links", "POST", {
          platform,
          url: check.url,
          label: label || `Astrologer Kavita on ${rule.label}`,
          icon: rule.icon,
          isVisible: true,
          showInFooter: true,
          showInHeader: platform === "whatsapp",
          includeInSameas: rule.isProfile,
        });
        setBusy(false);
        onAdded(res);
        if (res.ok) {
          setUrl("");
          setLabel("");
        }
      }}
    >
      <h2 className="font-serif text-lg font-medium tracking-tight">Add a link</h2>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <label className="flex flex-col gap-1 text-sm">
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_RULES[p].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Profile URL
          <Input
            value={url}
            placeholder={rule.hint}
            aria-invalid={check ? !check.ok : undefined}
            onChange={(e) => {
              setUrl(e.target.value);
              const d = detectPlatform(e.target.value);
              if (d) setPlatform(d);
            }}
          />
          <span
            className={cn("text-xs", check && !check.ok ? "text-error" : "text-muted-foreground")}
          >
            {check ? (check.ok ? `Will be saved as ${check.url}` : check.error) : rule.hint}
          </span>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Accessible label
        <Input
          value={label}
          placeholder={`Astrologer Kavita on ${rule.label}`}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        {rule.isProfile
          ? "Entity profile: included in sameAs by default."
          : "Contact channel: not an entity profile, so left out of sameAs."}
      </p>
      <Button
        type="submit"
        variant="gold"
        size="sm"
        className="self-start"
        disabled={disabled || busy || !check?.ok}
      >
        {busy ? "Adding…" : "Add link"}
      </Button>
    </form>
  );
}
