/**
 * Official tag snippets, one per provider, built from the public (non-secret) config
 * (CLAUDE.md §13C). Pure and isomorphic: the loader island turns these into `next/script`
 * elements, the admin preview shows them. IDs are escaped for a JS string context so a stray
 * quote in the database can never break out of the snippet.
 */
import type { IntegrationProvider } from "@/db/schema/integrations";

export interface TagSnippet {
  provider: IntegrationProvider;
  /** External scripts to load (afterInteractive). */
  external: { id: string; src: string }[];
  /** Inline bootstrap code (afterInteractive, after `external`). */
  inline: { id: string; code: string }[];
  /** Raw sanitised HTML (custom head/body) — injected by the loader, not by next/script. */
  html?: string;
}

type Config = Record<string, string | number | boolean | null>;

/** Safe inside a single-quoted JS string. */
function js(value: unknown): string {
  return String(value ?? "").replace(/[^A-Za-z0-9_:.\-/=+]/g, "");
}

function str(config: Config, key: string): string {
  const v = config[key];
  return typeof v === "string" ? v.trim() : "";
}

export function tagSnippet(provider: IntegrationProvider, config: Config): TagSnippet | null {
  const base = {
    provider,
    external: [] as TagSnippet["external"],
    inline: [] as TagSnippet["inline"],
  };
  switch (provider) {
    case "meta_pixel": {
      const id = js(str(config, "pixelId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-meta-pixel",
            code:
              "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
              `fbq('init','${id}');fbq('track','PageView');`,
          },
        ],
      };
    }
    case "google_tag": {
      const id = js(str(config, "tagId"));
      if (!id) return null;
      return {
        ...base,
        external: [{ id: "ak-gtag-js", src: `https://www.googletagmanager.com/gtag/js?id=${id}` }],
        inline: [
          {
            id: "ak-gtag-init",
            code: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${id}');`,
          },
        ],
      };
    }
    case "google_ads": {
      const id = js(str(config, "conversionId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-google-ads",
            code: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('config','${id}');`,
          },
        ],
      };
    }
    case "ga4": {
      const id = js(str(config, "measurementId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-ga4",
            code: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('config','${id}',{anonymize_ip:true});`,
          },
        ],
      };
    }
    case "linkedin_insight": {
      const id = js(str(config, "partnerId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-linkedin-init",
            code: `window._linkedin_partner_id='${id}';window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push('${id}');window.lintrk=window.lintrk||function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=window.lintrk.q||[];`,
          },
        ],
        external: [
          { id: "ak-linkedin-js", src: "https://snap.licdn.com/li.lms-analytics/insight.min.js" },
        ],
      };
    }
    case "pinterest_tag": {
      const id = js(str(config, "tagId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-pinterest",
            code:
              "!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version='3.0';var t=document.createElement('script');t.async=!0,t.src=e;var r=document.getElementsByTagName('script')[0];r.parentNode.insertBefore(t,r)}}('https://s.pinimg.com/ct/core.js');" +
              `pintrk('load','${id}');pintrk('page');`,
          },
        ],
      };
    }
    case "tiktok_pixel": {
      const id = js(str(config, "pixelId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-tiktok",
            code:
              "!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement('script');o.type='text/javascript',o.async=!0,o.src=i+'?sdkid='+e+'&lib='+t;var a=document.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};" +
              `ttq.load('${id}');ttq.page();}(window,document,'ttq');`,
          },
        ],
      };
    }
    case "microsoft_uet": {
      const id = js(str(config, "tagId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-uet",
            code: `(function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:'${id}',enableAutoSpaTracking:true};o.q=w[u],w[u]=new UET(o),w[u].push('pageLoad')},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=='loaded'&&s!=='complete'||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,'script','//bat.bing.com/bat.js','uetq');`,
          },
        ],
      };
    }
    case "gtm": {
      const id = js(str(config, "containerId"));
      if (!id) return null;
      return {
        ...base,
        inline: [
          {
            id: "ak-gtm",
            code: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`,
          },
        ],
      };
    }
    case "custom_head":
    case "custom_body": {
      const html = str(config, "html");
      return html ? { ...base, html } : null;
    }
    default:
      return null;
  }
}

/** The `<meta name="facebook-domain-verification">` value, when the pixel config carries one. */
export function metaDomainVerification(config: Config): string | null {
  const v = str(config, "domainVerification");
  return /^[a-z0-9]{16,80}$/i.test(v) ? v : null;
}
