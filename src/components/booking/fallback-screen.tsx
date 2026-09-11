import Link from "next/link";
import { MailIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { BOOK_ERRORS } from "@/content/pages/book";
import type { BookingChannels } from "./types";

export interface FallbackScreenProps {
  channels: BookingChannels;
  /** Plain-text summary (no birth details) to pre-fill WhatsApp and email. */
  summary: string;
  onBack: () => void;
}

/**
 * Shown when `POST /api/bookings` answers 503 `not_connected`: the real channels from
 * `site_settings`, each pre-filled with the visitor's request so nothing has to be retyped.
 */
export function FallbackScreen({ channels, summary, onBack }: FallbackScreenProps) {
  const copy = BOOK_ERRORS.notConnected;
  const wa = channels.whatsapp ? `${channels.whatsapp}?text=${encodeURIComponent(summary)}` : null;
  const mail = channels.email
    ? `${channels.email}?subject=${encodeURIComponent("Booking request")}&body=${encodeURIComponent(summary)}`
    : null;
  const hasChannel = Boolean(wa || mail);

  return (
    <div className="max-w-[44rem] space-y-6" role="status" id="booking-fallback">
      <div>
        <Heading as="h3" level={3}>
          {copy.title}
        </Heading>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{copy.body}</p>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-accent-border/40 bg-surface-muted px-5 py-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {summary}
      </pre>
      {hasChannel ? (
        <div className="flex flex-wrap gap-3">
          {wa ? (
            <Button asChild variant="gold" size="xl">
              <a href={wa} rel="noopener" target="_blank">
                <MessageCircleIcon aria-hidden="true" />
                {copy.send}
              </a>
            </Button>
          ) : null}
          {mail ? (
            <Button asChild variant="gold-outline" size="xl">
              <a href={mail}>
                <MailIcon aria-hidden="true" />
                {copy.email}
              </a>
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {copy.noChannels}{" "}
          <Link href="/contact" className="text-accent-strong">
            Contact page
          </Link>
        </p>
      )}
      <Button type="button" variant="ghost" size="lg" onClick={onBack} className="-ml-3">
        Back to the summary
      </Button>
    </div>
  );
}
