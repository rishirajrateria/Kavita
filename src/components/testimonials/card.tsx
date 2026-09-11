import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { TESTIMONIALS_LIST } from "@/content/pages/testimonials";
import type { Testimonial } from "@/lib/data";

export interface TestimonialCardProps {
  testimonial: Testimonial;
  placeName?: string;
  serviceName?: string;
}

/**
 * One client experience: name, place, service, date, the quote, and a "published with
 * permission" badge only when `consentGiven` is true. Stars only when the client gave them.
 */
export function TestimonialCard({ testimonial: t, placeName, serviceName }: TestimonialCardProps) {
  return (
    <figure
      className="relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border bg-background p-6 pt-14 shadow-xs"
      data-placeholder={t.isPlaceholder ? "testimonial" : undefined}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2 left-5 font-serif text-[4rem] leading-none text-accent-strong/25 select-none"
      >
        &ldquo;
      </span>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {t.rating != null ? <Rating value={t.rating} size="sm" /> : <span />}
        {t.consentGiven ? (
          <Badge variant="gold" className="text-[0.68rem]">
            {TESTIMONIALS_LIST.consentBadge}
          </Badge>
        ) : null}
      </div>
      <blockquote className="flex-1 leading-relaxed">
        <p>{t.quote}</p>
      </blockquote>
      <figcaption className="border-t border-accent-border/30 pt-4 text-sm text-muted-foreground">
        <span className="font-serif text-base text-foreground">{t.clientName}</span>
        {placeName ? <span> · {placeName}</span> : null}
        <span className="block sm:mt-0.5">
          {serviceName ?? TESTIMONIALS_LIST.unknownService}
          {t.date ? (
            <>
              {" · "}
              <time dateTime={t.date.toISOString().slice(0, 10)}>
                {t.date.toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
              </time>
            </>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}
