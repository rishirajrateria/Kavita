/**
 * `POST /api/admin/integrations/test` — run one provider's "test connection" (CLAUDE.md §13B/C).
 *
 * Search Console pulls the last 7 days of impressions, Bing lists the site, the Conversions API
 * sends a real test event under the stored `test_event_code`; every other provider is checked by
 * ID format only, because there is nothing to call. The outcome (and, when it succeeds, the
 * verified-at timestamp) is stored on the row so the card can show "last verified".
 */
import { z } from "zod";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { isIntegrationProvider, type IntegrationProvider } from "@/lib/integrations/providers";
import { getIntegrationConfig, recordTestResult } from "@/lib/integrations/store";
import { testConnection } from "@/lib/integrations/test-connection";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const schema = z.object({
  provider: z.string().refine(isIntegrationProvider, "Unknown provider"),
});

export const POST = adminRoute(
  async ({ data, audit }) => {
    const provider = data.provider as IntegrationProvider;
    const record = await getIntegrationConfig(provider);
    if (record.undecryptable.length) {
      throw new AdminRouteError(
        "conflict",
        `Stored secret could not be decrypted (${record.undecryptable.join(", ")}). Re-enter it.`,
      );
    }
    const related =
      provider === "meta_capi" ? { metaPixel: await getIntegrationConfig("meta_pixel") } : {};
    const result = await testConnection(provider, record, related);
    await recordTestResult(provider, result.status, result.message);
    await audit({
      action: "integrations.test",
      entityType: "integrations",
      entityId: record.id,
      after: { provider, status: result.status, message: result.message },
    });
    return { result };
  },
  { role: "owner", schema },
);
