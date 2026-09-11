/**
 * One row per supported integration provider, all disabled with empty config (CLAUDE.md §13).
 * The admin enables each by entering an ID; nothing is hardcoded anywhere else.
 */
import { INTEGRATION_PROVIDERS, type Integration } from "@/db/schema";
import type { SeedRow } from "./_shared";

export const integrationsSeed: SeedRow<Integration>[] = INTEGRATION_PROVIDERS.map((provider) => ({
  provider,
  config: {},
  isEnabled: false,
  loadsInRegions: [],
  updatedBy: null,
  lastVerifiedAt: null,
  lastTestStatus: null,
  lastTestMessage: null,
  notes: null,
}));
