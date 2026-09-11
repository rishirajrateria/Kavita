/**
 * The ONE place that decides which third-party tag loads (CLAUDE.md §13C/E). Server component.
 *
 * Inputs: the `integrations` rows (public projection — never a secret), the visitor's region
 * from the edge geo header, the `ak_consent` cookie and the admin's `consent_config`.
 * `whatLoads()` (`src/lib/integrations/what-loads.ts`) turns those into one decision per
 * provider; this component renders only what that decision permits:
 *
 *   • `next/script` `afterInteractive` snippets from `src/lib/integrations/snippets.ts`
 *   • sanitised custom head/body HTML
 *   • verification `<meta>` tags from `verification_tags` + Meta domain verification
 *     (React 19 hoists `<meta>` into `<head>` from anywhere in the tree)
 *   • the pixel fan-out island (only when a tag that receives events actually loaded)
 *   • the consent banner island (only when a third-party tag is enabled at all, per §13E — it
 *     opens by itself in a consent region with no stored choice, and otherwise stays closed
 *     until the footer's "Manage consent" link is clicked, so a visitor anywhere can opt out)
 *
 * Static by default: with no tag enabled (the shipped state) it returns before touching
 * `headers()`, so every public page stays SSG/ISR with zero extra JS — no fbq, no gtag, no
 * banner. Enabling a tag necessarily makes the layout dynamic: which tag may load depends on
 * the visitor's country and their stored consent, and that cannot be baked into static HTML.
 */
import { headers } from "next/headers";
import Script from "next/script";
import type { ReactElement } from "react";
import { ConsentBanner } from "@/components/consent/banner";
import { PixelFanout } from "@/components/layout/pixel-fanout";
import type { IntegrationProvider } from "@/db/schema/integrations";
import { getConsentConfig } from "@/lib/consent/config";
import { consentStateFor, readConsentCookie } from "@/lib/consent/cookie";
import { getEventMappings } from "@/lib/integrations/mappings";
import { PROVIDERS } from "@/lib/integrations/providers";
import { sanitizeCustomHtml } from "@/lib/integrations/sanitize";
import { metaDomainVerification, tagSnippet } from "@/lib/integrations/snippets";
import { listIntegrations, type PublicIntegration } from "@/lib/integrations/store";
import { enabledVerificationMetas } from "@/lib/integrations/verification";
import { whatLoads } from "@/lib/integrations/what-loads";

/** Edge geo headers: Vercel first, then Cloudflare, then a local override for testing. */
function regionFrom(headerList: Headers): string | null {
  return (
    headerList.get("x-vercel-ip-country") ??
    headerList.get("cf-ipcountry") ??
    headerList.get("x-ak-country")
  );
}

const NO_EVENTS = new Set<IntegrationProvider>(["custom_head", "custom_body", "gtm"]);

export async function Integrations() {
  let all: PublicIntegration[] = [];
  let metas: { name: string; content: string }[] = [];
  try {
    [all, metas] = await Promise.all([listIntegrations(), enabledVerificationMetas()]);
  } catch {
    // A database hiccup must never take the page down — and never silently load a tag either.
    return null;
  }

  const enabledTags = all.filter((i) => i.isEnabled && PROVIDERS[i.provider].rendersTag);
  if (enabledTags.length === 0) {
    // Nothing to decide: render the verification metas (static) and stay out of the way.
    return metas.length ? <VerificationMetas metas={metas} /> : null;
  }

  const config = await getConsentConfig();
  const headerList = await headers();
  const cookie = readConsentCookie(headerList.get("cookie"));
  const decision = whatLoads({
    region: regionFrom(headerList),
    consent: consentStateFor(cookie, config.policyVersion),
    integrations: all,
    policy: {
      consentRegions: config.consentRegions,
      unknownRegionRequiresConsent: config.unknownRegionRequiresConsent,
    },
  });

  const byProvider = new Map(all.map((i) => [i.provider, i]));
  const pixel = byProvider.get("meta_pixel");
  const domainVerification = pixel?.isEnabled ? metaDomainVerification(pixel.config) : null;

  const scripts: ReactElement[] = [];
  const rawHtml: { id: string; html: string }[] = [];
  for (const provider of decision.loading) {
    const integration = byProvider.get(provider);
    if (!integration) continue;
    const snippet = tagSnippet(provider, integration.config);
    if (!snippet) continue;
    for (const external of snippet.external) {
      scripts.push(
        <Script
          key={external.id}
          id={external.id}
          src={external.src}
          strategy="afterInteractive"
        />,
      );
    }
    for (const inline of snippet.inline) {
      scripts.push(
        <Script key={inline.id} id={inline.id} strategy="afterInteractive">
          {inline.code}
        </Script>,
      );
    }
    if (snippet.html) {
      const { html } = sanitizeCustomHtml(
        snippet.html,
        provider === "custom_head" ? "head" : "body",
      );
      if (html) rawHtml.push({ id: `ak-${provider}`, html });
    }
  }

  // Only pay for the fan-out island when a tag that receives conversion events loaded.
  const eventProviders = decision.loading.filter((p) => !NO_EVENTS.has(p));
  const mappings = eventProviders.length ? await getEventMappings() : [];

  return (
    <>
      <VerificationMetas metas={metas} />
      {domainVerification ? (
        <meta name="facebook-domain-verification" content={domainVerification} />
      ) : null}
      {scripts}
      {rawHtml.map((entry) => (
        <div key={entry.id} hidden dangerouslySetInnerHTML={{ __html: entry.html }} />
      ))}
      {eventProviders.length ? (
        <PixelFanout
          providers={eventProviders}
          configs={Object.fromEntries(
            eventProviders.map((p) => [p, byProvider.get(p)?.config ?? {}]),
          )}
          mappings={mappings}
        />
      ) : null}
      {decision.hasThirdPartyTags ? (
        <ConsentBanner
          open={decision.showBanner}
          title={config.title}
          body={config.body}
          acceptLabel={config.acceptLabel}
          rejectLabel={config.rejectLabel}
          policyVersion={config.policyVersion}
        />
      ) : null}
    </>
  );
}

function VerificationMetas({ metas }: { metas: { name: string; content: string }[] }) {
  return (
    <>
      {metas.map((meta) => (
        <meta key={`${meta.name}:${meta.content}`} name={meta.name} content={meta.content} />
      ))}
    </>
  );
}
