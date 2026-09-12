import Image from "next/image";
import Link from "next/link";
import { PRACTITIONER, credentialLine } from "@/content/practitioner";
import { getSiteSettings } from "@/lib/data";
import { realValue } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface BylineProps {
  /** `YYYY-MM-DD`. */
  datePublished: string;
  /** `YYYY-MM-DD`; omitted when never revised. */
  dateModified?: string;
  readingMinutes?: number;
  className?: string;
  /** Hide the small portrait (e.g. on `/about`, where the full photograph is shown). */
  withoutPhoto?: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `2026-09-11` → `11 September 2026`, without any time-zone arithmetic. */
export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = m ? MONTHS[m - 1] : undefined;
  if (!y || !month || !d) return iso;
  return `${d} ${month} ${y}`;
}

/**
 * E-E-A-T author byline (CLAUDE.md §8): the practitioner's name linking to `/about`, her
 * credential line (placeholder-safe: the plain job title until real credentials exist), and
 * visible `datePublished` / `dateModified` in `<time dateTime>`. Server component; reads the
 * name from `site_settings` so a rename is one edit.
 */
export async function Byline({
  datePublished,
  dateModified,
  readingMinutes,
  className,
  withoutPhoto = false,
}: BylineProps) {
  const settings = await getSiteSettings();
  const name = realValue(settings.practitionerName) ?? settings.brandName;
  const modified = dateModified && dateModified !== datePublished ? dateModified : undefined;

  return (
    <div
      data-slot="byline"
      className={cn(
        "flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-accent-border/40 py-5 text-sm",
        className,
      )}
    >
      <p className="flex items-center gap-3">
        {withoutPhoto ? null : (
          <Image
            src={PRACTITIONER.photo.src}
            width={40}
            height={40}
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0 rounded-full border border-accent-border/50 object-cover"
          />
        )}
        <span>
          <span className="text-muted-foreground">By </span>
          <Link
            href="/about"
            rel="author"
            className="font-serif text-base text-foreground underline decoration-accent-border/60 underline-offset-[3px] hover:decoration-accent-strong"
          >
            {name}
          </Link>
          <span className="block text-muted-foreground sm:ml-2 sm:inline">{credentialLine()}</span>
        </span>
      </p>

      <p className="text-muted-foreground">
        <span>Published </span>
        <time dateTime={datePublished} className="text-foreground">
          {formatDisplayDate(datePublished)}
        </time>
        {modified ? (
          <>
            <span aria-hidden="true"> · </span>
            <span>Updated </span>
            <time dateTime={modified} className="text-foreground">
              {formatDisplayDate(modified)}
            </time>
          </>
        ) : null}
        {readingMinutes ? (
          <>
            <span aria-hidden="true"> · </span>
            <span>{readingMinutes} min read</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
