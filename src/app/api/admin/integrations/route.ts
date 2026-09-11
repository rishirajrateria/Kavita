/**
 * `PATCH /api/admin/integrations` — save one provider card (CLAUDE.md §13).
 *
 * Body: `{ provider, isEnabled?, loadsInRegions?, notes?, <field>… }`. Field values are validated
 * against the provider registry before anything is written; secrets are encrypted by
 * `setIntegrationConfig` and a blank secret keeps the stored value (so the form never has to
 * echo a token back to the browser). The audit diff holds the public projection only — a
 * credential never reaches `admin_audit_log`.
 */
import { z } from "zod";
import { getDb } from "@/db";
import { AdminRouteError, adminRoute, readAdminBody } from "@/lib/admin/mutations";
import { parseRegionList } from "@/lib/integrations/validators";
import {
  isIntegrationProvider,
  PROVIDERS,
  validateProviderConfig,
  type IntegrationProvider,
} from "@/lib/integrations/providers";
import {
  SecretsUnavailableError,
  getPublicIntegrationConfig,
  setIntegrationConfig,
} from "@/lib/integrations/store";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    provider: z.string().refine(isIntegrationProvider, "Unknown provider"),
    isEnabled: z.union([z.boolean(), z.literal("on"), z.literal("off")]).optional(),
    loadsInRegions: z.string().optional(),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();

function boolFrom(value: boolean | "on" | "off" | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === true || value === "on";
}

export const PATCH = adminRoute(
  async ({ request, audit }) => {
    const raw = await readAdminBody(request);
    if (!raw) throw new AdminRouteError("bad_request");
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) throw new AdminRouteError("validation", "Unknown provider");
    const { provider: providerRaw, isEnabled, loadsInRegions, notes, ...rest } = parsed.data;
    const provider = providerRaw as IntegrationProvider;

    const fieldKeys = new Set(PROVIDERS[provider].fields.map((f) => f.key));
    const config: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (!fieldKeys.has(key)) continue;
      config[key] = typeof value === "string" ? value : value === null ? null : String(value ?? "");
    }

    const existing = await getPublicIntegrationConfig(provider);
    const storedSecrets = Object.entries(existing.secretsSet)
      .filter(([, set]) => set)
      .map(([key]) => key);
    const errors = validateProviderConfig(provider, config, storedSecrets);
    if (Object.keys(errors).length) {
      throw new AdminRouteError("validation", "Check the fields", {
        errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])),
      });
    }

    let regions: string[] | undefined;
    if (loadsInRegions !== undefined) {
      const list = parseRegionList(loadsInRegions);
      if (list.error) {
        throw new AdminRouteError("validation", list.error, {
          errors: { loadsInRegions: [list.error] },
        });
      }
      regions = list.regions;
    }

    const enabled = boolFrom(isEnabled);
    if (enabled) {
      // Never let a provider go live with a missing required ID.
      const required = validateProviderConfig(
        provider,
        { ...existing.config, ...config },
        storedSecrets,
      );
      if (Object.keys(required).length) {
        throw new AdminRouteError("validation", "Fill the required fields before enabling.", {
          errors: Object.fromEntries(Object.entries(required).map(([k, v]) => [k, [v]])),
        });
      }
    }

    if (!getDb()) throw new AdminRouteError("not_connected");
    let result;
    try {
      result = await setIntegrationConfig(
        provider,
        {
          config,
          ...(enabled === undefined ? {} : { isEnabled: enabled }),
          ...(regions === undefined ? {} : { loadsInRegions: regions }),
          ...(notes === undefined ? {} : { notes: notes.trim() || null }),
        },
        null,
      );
    } catch (error) {
      if (error instanceof SecretsUnavailableError) {
        throw new AdminRouteError("not_connected", error.message);
      }
      throw error;
    }

    await audit({
      action: "integrations.update",
      entityType: "integrations",
      entityId: result.after.id,
      before: result.before,
      after: result.after,
    });
    return { integration: result.after };
  },
  { role: "owner" },
);
