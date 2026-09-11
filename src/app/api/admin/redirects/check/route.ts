/** `POST /api/admin/redirects/check` — dry-run loop/chain check for a rule (viewer+). */
import { getDb } from "@/db";
import { adminRoute } from "@/lib/admin/mutations";
import { describeChain } from "@/lib/redirects/graph";
import { prepareSave, redirectInputSchema, RedirectSaveError } from "@/lib/redirects/store";

export const dynamic = "force-dynamic";

export const POST = adminRoute(
  async ({ data }) => {
    const db = getDb();
    if (!db) return { loop: false, chain: [], message: null };
    try {
      const { check } = await prepareSave(db, data);
      return {
        loop: false,
        chain: check.chain,
        finalDestination: check.finalDestination,
        message: describeChain(check, data.fromPath),
      };
    } catch (error) {
      if (error instanceof RedirectSaveError && error.reason === "loop") {
        return { loop: true, chain: [], message: error.message };
      }
      throw error;
    }
  },
  { role: "viewer", schema: redirectInputSchema, requireDatabase: false },
);
