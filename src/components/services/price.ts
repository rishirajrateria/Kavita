/**
 * Price display for services. A real `priceMinor` + `currency` is formatted; a missing price
 * (or a `{{PRICE}}` note) renders as "Price on request" and is flagged with `data-placeholder`
 * so reviewers can find it — the `{{` marker itself never reaches the HTML.
 */
import { PRICE_LABELS } from "@/content/pages/services";
import type { Currency, Service } from "@/lib/data";
import { isPlaceholder, realValue } from "@/lib/site";

const LOCALE: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  AED: "en-AE",
};

export function formatMoney(amountMinor: number, currency: Currency): string {
  const whole = amountMinor % 100 === 0;
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountMinor / 100);
}

export interface PriceDisplay {
  /** Text to show, e.g. "₹5,000" or "Price on request". */
  text: string;
  /** Other currencies the client may pay in, formatted. */
  alternatives: string[];
  /** True when no real price exists yet. */
  placeholder: boolean;
  /** Real headline price for schema `offers`; undefined when placeholder. */
  offer?: { amountMinor: number; currency: Currency };
}

export function servicePrice(service: Service): PriceDisplay {
  if (service.priceMinor != null && service.priceMinor > 0 && service.currency) {
    const alternatives = (Object.entries(service.prices) as [Currency, number | undefined][])
      .filter(([c, v]) => c !== service.currency && typeof v === "number" && v > 0)
      .map(([c, v]) => formatMoney(v as number, c));
    return {
      text: formatMoney(service.priceMinor, service.currency),
      alternatives,
      placeholder: false,
      offer: { amountMinor: service.priceMinor, currency: service.currency },
    };
  }
  const note = realValue(service.priceNote);
  return {
    text: note && !isPlaceholder(service.priceNote) ? note : PRICE_LABELS.onRequest,
    alternatives: [],
    placeholder: !note || isPlaceholder(service.priceNote),
  };
}
