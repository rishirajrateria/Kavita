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
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <SocialIcon name={resolveSocialIcon(link.icon, link.platform)} size={iconSize} />
          </a>
        </li>
      ))}
    </ul>
  );
}
