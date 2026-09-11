"use client";

/**
 * Multipart upload to `/api/admin/og-library` (Phase 6 P6-A). `ActionForm` posts JSON, so the
 * image library needs its own tiny island. Disabled (with the reason) when Storage is absent.
 */
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OgUploadForm({
  storageReady,
  canEdit,
}: {
  storageReady: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/og-library", {
        method: "POST",
        body: new FormData(form),
        headers: { accept: "application/json" },
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        reason?: string;
      };
      if (!response.ok) {
        setStatus(body.message ?? `Upload failed (${body.reason ?? response.status}).`);
        return;
      }
      setStatus("Uploaded.");
      form.reset();
      router.refresh();
    } catch {
      setStatus("Network error — nothing was uploaded.");
    } finally {
      setBusy(false);
    }
  }

  const disabled = !storageReady || !canEdit;
  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-describedby={`${id}-status`}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-file`} className="text-sm font-medium">
          Image (PNG, JPEG or WebP, 1200×630 recommended, ≤ 4 MB)
        </label>
        <input
          id={`${id}-file`}
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          disabled={disabled}
          className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-label`} className="text-sm font-medium">
          Label
        </label>
        <Input id={`${id}-label`} name="label" required maxLength={120} disabled={disabled} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-alt`} className="text-sm font-medium">
          Alt text
        </label>
        <Input id={`${id}-alt`} name="alt" maxLength={300} disabled={disabled} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="gold" disabled={disabled || busy}>
          {busy ? "Uploading…" : "Upload to library"}
        </Button>
        <p id={`${id}-status`} role="status" className="text-xs text-muted-foreground">
          {status}
        </p>
      </div>
      {!storageReady ? (
        <p className="rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">
          Supabase Storage is not configured (<code>NEXT_PUBLIC_SUPABASE_URL</code> +{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, public bucket <code>og-library</code>). Images can
          be listed but not uploaded until it is.
        </p>
      ) : null}
    </form>
  );
}
