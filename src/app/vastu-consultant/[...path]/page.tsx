import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeoPage } from "@/components/geo/geo-page";
import { getPublishableLocations } from "@/lib/data/locations";
import { buildGeoMetadata } from "@/lib/geo/metadata";
import { resolvePublishableLocation } from "@/lib/geo/resolve";
import { getSiteUrl } from "@/lib/site";

const SERVICE = "vastu-consultant" as const;

/** Only locations with research exist as pages; anything else is a 404, never a thin page. */
export const dynamicParams = false;
/** ISR: research changes land within a day without a redeploy. */
export const revalidate = 86400;

export async function generateStaticParams() {
  const locations = await getPublishableLocations();
  return locations.map((l) => ({ path: l.path.split("/") }));
}

export async function generateMetadata({
  params,
}: PageProps<"/vastu-consultant/[...path]">): Promise<Metadata> {
  const { path } = await params;
  const loc = await resolvePublishableLocation(path);
  if (!loc) return {};
  return buildGeoMetadata(loc, SERVICE, getSiteUrl());
}

/** `/vastu-consultant/{country}[/{state}[/{city}]]` — thin wrapper around the shared template. */
export default async function VastuGeoPage({ params }: PageProps<"/vastu-consultant/[...path]">) {
  const { path } = await params;
  const loc = await resolvePublishableLocation(path);
  if (!loc) notFound();
  return <GeoPage service={SERVICE} loc={loc} level={loc.type} />;
}
