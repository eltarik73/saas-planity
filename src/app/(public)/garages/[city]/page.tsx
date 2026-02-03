import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, slugToDisplay } from "@/lib/seo";
import { formatPrice } from "@/lib/date-utils";
import { Badge } from "@/components/ui/forms";
import { SearchForm } from "@/components/shared/search-form";

interface Props {
  params: { city: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = slugToDisplay(params.city);
  return buildMetadata({
    title: `Garages auto à ${cityName}`,
    description: `Trouvez et réservez en ligne votre garage auto à ${cityName}. Comparez les prestations, les tarifs et les disponibilités.`,
    path: `/garages/${params.city}`,
  });
}

export async function generateStaticParams() {
  const cities = await prisma.business.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ["city"],
  });
  return cities.map((c) => ({
    city: c.city.toLowerCase().replace(/\s+/g, "-"),
  }));
}

async function getGaragesByCity(citySlug: string) {
  return prisma.business.findMany({
    where: { isActive: true, city: { equals: citySlug.replace(/-/g, " "), mode: "insensitive" } },
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 5 } },
    orderBy: { name: "asc" },
  });
}

export default async function CityPage({ params }: Props) {
  const garages = await getGaragesByCity(params.city);
  const cityName = garages.length > 0 ? garages[0].city : slugToDisplay(params.city);

  if (garages.length === 0) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Garages auto à {cityName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {garages.length} garage{garages.length !== 1 ? "s" : ""} disponible{garages.length !== 1 ? "s" : ""} à {cityName}
      </p>

      <div className="mt-6">
        <SearchForm defaultCity={cityName} />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {garages.map((garage) => {
          const minPrice = garage.services.length > 0
            ? Math.min(...garage.services.map((s) => s.priceCents))
            : null;

          return (
            <Link
              key={garage.id}
              href={`/garage/${garage.slug}`}
              className="group rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden rounded-t-xl bg-gradient-to-br from-blue-50 to-slate-100">
                {garage.coverUrl ? (
                  <img src={garage.coverUrl} alt={garage.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-blue-200">🔧</div>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold group-hover:text-primary">{garage.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{garage.address}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {garage.services.slice(0, 3).map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {minPrice && (
                    <span className="text-sm text-muted-foreground">
                      Dès <span className="font-semibold text-primary">{formatPrice(minPrice)}</span>
                    </span>
                  )}
                  <span className="text-sm font-medium text-primary">Réserver →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
