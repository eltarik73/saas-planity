import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, slugToDisplay } from "@/lib/seo";
import { formatPrice } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/forms";

interface Props {
  params: { serviceCity: string };
}

function parseServiceCity(slug: string) {
  const parts = slug.split("-");
  if (parts.length < 2) return null;
  const city = parts[parts.length - 1];
  const service = parts.slice(0, -1).join("-");
  return { service: slugToDisplay(service), city: slugToDisplay(city) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseServiceCity(params.serviceCity);
  if (!parsed) return {};
  return buildMetadata({
    title: `${parsed.service} à ${parsed.city}`,
    description: `Trouvez un garage pour votre ${parsed.service.toLowerCase()} à ${parsed.city}. Réservez en ligne, tarifs et disponibilités.`,
    path: `/prestation/${params.serviceCity}`,
  });
}

async function getResults(serviceName: string, cityName: string) {
  return prisma.business.findMany({
    where: {
      isActive: true,
      city: { equals: cityName, mode: "insensitive" },
      services: {
        some: {
          isActive: true,
          OR: [
            { name: { contains: serviceName, mode: "insensitive" } },
            { category: { contains: serviceName, mode: "insensitive" } },
          ],
        },
      },
    },
    include: {
      services: {
        where: {
          isActive: true,
          OR: [
            { name: { contains: serviceName, mode: "insensitive" } },
            { category: { contains: serviceName, mode: "insensitive" } },
          ],
        },
        orderBy: { priceCents: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function PrestationCityPage({ params }: Props) {
  const parsed = parseServiceCity(params.serviceCity);
  if (!parsed) notFound();

  const garages = await getResults(parsed.service, parsed.city);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {parsed.service} à {parsed.city}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {garages.length} garage{garages.length !== 1 ? "s" : ""} proposant cette prestation
      </p>

      {garages.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">Aucun résultat pour cette recherche.</p>
          <Link href="/garages"><Button variant="outline" className="mt-4">Tous les garages</Button></Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {garages.map((g) => (
            <div key={g.id} className="flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/garage/${g.slug}`} className="text-lg font-semibold hover:text-primary">{g.name}</Link>
                <p className="text-sm text-muted-foreground">{g.address}, {g.city}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.services.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">
                      {s.name} — {formatPrice(s.priceCents)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Link href={`/booking?garage=${g.slug}`}>
                <Button>Réserver</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
