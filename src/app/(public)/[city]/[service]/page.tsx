import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, slugToDisplay } from "@/lib/seo";
import { formatPrice, formatDuration } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";

interface Props {
  params: { city: string; service: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = slugToDisplay(params.city);
  const service = slugToDisplay(params.service);
  return buildMetadata({
    title: `${service} à ${city} — Garages auto`,
    description: `Comparez les garages proposant ${service.toLowerCase()} à ${city}. Réservez en ligne en quelques clics.`,
    path: `/${params.city}/${params.service}`,
  });
}

async function getResults(citySlug: string, serviceSlug: string) {
  const city = citySlug.replace(/-/g, " ");
  const service = serviceSlug.replace(/-/g, " ");

  return prisma.business.findMany({
    where: {
      isActive: true,
      city: { equals: city, mode: "insensitive" },
      services: {
        some: {
          isActive: true,
          OR: [
            { name: { contains: service, mode: "insensitive" } },
            { category: { contains: service, mode: "insensitive" } },
          ],
        },
      },
    },
    include: {
      services: {
        where: {
          isActive: true,
          OR: [
            { name: { contains: service, mode: "insensitive" } },
            { category: { contains: service, mode: "insensitive" } },
          ],
        },
        orderBy: { priceCents: "asc" },
        take: 3,
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function CityServicePage({ params }: Props) {
  const garages = await getResults(params.city, params.service);
  const city = garages.length > 0 ? garages[0].city : slugToDisplay(params.city);
  const service = slugToDisplay(params.service);

  if (garages.length === 0) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {service} à {city}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {garages.length} garage{garages.length !== 1 ? "s" : ""} — réservation en ligne
      </p>

      <div className="mt-8 space-y-4">
        {garages.map((g) => (
          <div key={g.id} className="rounded-lg border p-5 transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href={`/garage/${g.slug}`} className="text-lg font-semibold hover:text-primary">{g.name}</Link>
                <p className="text-sm text-muted-foreground">{g.address}, {g.postalCode} {g.city}</p>
              </div>
              <Link href={`/booking?garage=${g.slug}`}>
                <Button>Réserver</Button>
              </Link>
            </div>
            {g.services.length > 0 && (
              <div className="mt-4 divide-y rounded-lg bg-muted/30">
                {g.services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-muted-foreground">{formatDuration(s.durationMin)}</span>
                    </div>
                    <span className="font-semibold text-primary">{formatPrice(s.priceCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
