import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, type BreadcrumbItem as Crumb } from "@/lib/seo/schema";
import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface BreadcrumbsProps {
  /** Trail excluding Home, which is prepended automatically. Last item is the current page. */
  items: Crumb[];
  className?: string;
  /** Skip the automatic "Home" crumb. */
  withoutHome?: boolean;
}

/**
 * Visible breadcrumb trail + `BreadcrumbList` JSON-LD (CLAUDE.md §8). Not rendered on the home
 * page; every other page passes its trail.
 */
export function Breadcrumbs({ items, className, withoutHome = false }: BreadcrumbsProps) {
  const trail: Crumb[] = withoutHome ? items : [{ name: "Home", href: "/" }, ...items];
  if (trail.length === 0) return null;
  const last = trail.length - 1;

  return (
    <>
      <Breadcrumb className={cn("py-3", className)}>
        <BreadcrumbList>
          {trail.map((crumb, index) => (
            <BreadcrumbItemGroup
              key={crumb.href}
              crumb={crumb}
              isLast={index === last}
              isFirst={index === 0}
            />
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <JsonLd data={breadcrumbSchema(trail, getSiteUrl())} />
    </>
  );
}

function BreadcrumbItemGroup({
  crumb,
  isLast,
  isFirst,
}: {
  crumb: Crumb;
  isLast: boolean;
  isFirst: boolean;
}) {
  return (
    <>
      {isFirst ? null : <BreadcrumbSeparator />}
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={crumb.href}>{crumb.name}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  );
}
