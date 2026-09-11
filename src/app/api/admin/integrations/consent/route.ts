/**
 * `PATCH /api/admin/integrations/consent` — edit the consent banner copy, the policy version
 * and the list of countries where third-party tags wait for consent (CLAUDE.md §13E).
 *
 * Bumping the policy version re-asks everyone: stored choices were made under the old wording,
 * so they no longer count. The copy must stay honest and the two buttons equal in weight — the
 * admin screen says so next to these fields.
 */
import { z } from "zod";
import { AdminRouteError, adminRoute } from "@/lib/admin/mutations";
import { setConsentConfig } from "@/lib/consent/config";
import { parseRegionList } from "@/lib/integrations/validators";

export const dynamic = "force-dynamic";

const schema = z.object({
  policyVersion: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[\w.-]+$/, "Letters, digits, dots and hyphens only."),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20).max(2000),
  acceptLabel: z.string().trim().min(2).max(60),
  rejectLabel: z.string().trim().min(2).max(60),
  consentRegions: z.string().max(2000),
  unknownRegionRequiresConsent: z
    .union([z.boolean(), z.literal("on"), z.literal("off")])
    .optional(),
});

export const PATCH = adminRoute(
  async ({ data, audit }) => {
    const regions = parseRegionList(data.consentRegions);
    if (regions.error) {
      throw new AdminRouteError("validation", regions.error, {
        errors: { consentRegions: [regions.error] },
      });
    }
    if (regions.regions.length === 0) {
      throw new AdminRouteError(
        "validation",
        "Leaving the list empty would load advertising tags in the UK and EU without consent. Keep at least the UK/EEA codes.",
        { errors: { consentRegions: ["At least one country code is required."] } },
      );
    }
    const result = await setConsentConfig(
      {
        policyVersion: data.policyVersion,
        title: data.title,
        body: data.body,
        acceptLabel: data.acceptLabel,
        rejectLabel: data.rejectLabel,
        consentRegions: regions.regions,
        unknownRegionRequiresConsent:
          data.unknownRegionRequiresConsent === undefined
            ? true
            : data.unknownRegionRequiresConsent === true ||
              data.unknownRegionRequiresConsent === "on",
      },
      null,
    );
    await audit({
      action: "consent_config.update",
      entityType: "consent_config",
      before: result.before,
      after: result.after,
    });
    return { config: result.after };
  },
  { role: "owner", schema },
);
