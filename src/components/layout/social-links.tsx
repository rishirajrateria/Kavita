import { SocialIcon, resolveSocialIcon } from "@/components/icons/social";
import { getSocialLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export interface SocialLinksProps {
  /** Which placement's visibility flag to honour. */
  placement: "footer" | "header";
  className?: string;
  iconSize?: number;
}

/**
 * Server component. Reads `social_links` (visible rows, sorted by `sort_order`) and renders
 * accessible icon links. Renders nothing when no link is enabled for the placement.
 *
 * Footer icons sit in hairline circles — small instruments in a row — and warm to gold with a
 * 2px lift on hover. Header icons drop the ring so the frosted rail stays uncluttered next to
 * the theme toggle, which is also a bare ghost control.
 */
export async function SocialLinks({ placement, className, iconSize = 20 }: SocialLinksProps) {
  const links = (await getSocialLinks())
    .filter((l) => l.isVisible && (placement === "footer" ? l.showInFooter : l.showInHeader))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (links.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-1", className)}
      data-social-links={placement}
    >
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            rel="me noopener"
            target="_blank"
            aria-label={link.label || link.platform}
            title={link.label || link.platform}
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground",
              "transition-[color,border-color,translate] duration-(--duration-base) ease-standard",
              "hover:-translate-y-0.5 hover:text-accent-strong motion-reduce:hover:translate-y-0",
              placement === "footer"
                ? "size-11 border border-border/70 hover:border-accent-border/70"
                : "size-9",
            )}
          >
            <SocialIcon name={resolveSocialIcon(link.icon, link.platform)} size={iconSize} />
          </a>
        </li>
      ))}
    </ul>
  );
}
