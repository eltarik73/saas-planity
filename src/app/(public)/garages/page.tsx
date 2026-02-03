import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/shared/search-form";
import { Badge } from "@/components/ui/forms";

export const metadata = buildMetadata({
  title: "Trouver un garage auto",
  description: "Recherchez et comparez les garages auto près de chez vous. Réservez en ligne en quelques clics.",
  path: "/garages",
});

async function getGarages(city?: string, service?: string) {
  const where: any = { isActive: true };
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (service) {
    where.services = { some: { category: { contains: service, mode: "insensitive" }, isActive: true } };
  }

  return prisma.business.findMany({
    where,
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 5 } },
    orderBy: { name: "asc" },
    take: 50,
  });
}

export default async function GaragesPage({
  searchParams,
}: {
  searchParams: { city?: string; service?: string };
}) {
  const garages = await getGarages(searchParams.city, searchParams.service);
  const city = searchParams.city;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {city ? `Garages auto à ${city.charAt(0).toUpperCase() + city.slice(1)}` : "Tous les garages auto"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {garages.length} garage{garages.length !== 1 ? "s" : ""} trouvé{garages.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6">
        <SearchForm defaultCity={city ?? ""} defaultService={searchParams.service ?? ""} />
      </div>

      {garages.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">Aucun garage trouvé pour cette recherche.</p>
          <Link href="/garages">
            <Button variant="outline" className="mt-4">Voir tous les garages</Button>
          </Link>
        </div>
      ) : (
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
                {/* Cover */}
                <div className="relative h-40 overflow-hidden rounded-t-xl bg-gradient-to-br from-blue-50 to-slate-100">
                  {garage.coverUrl ? (
                    <img src={garage.coverUrl} alt={garage.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-blue-200">🔧</div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-semibold group-hover:text-primary">{garage.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {garage.address}, {garage.postalCode} {garage.city}
                  </p>

                  {/* Services preview */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {garage.services.slice(0, 3).map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.name}
                      </Badge>
                    ))}
                    {garage.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{garage.services.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-center justify-between">
                    {minPrice && (
                      <span className="text-sm text-muted-foreground">
                        À partir de <span className="font-semibold text-primary">{formatPrice(minPrice)}</span>
                      </span>
                    )}
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Réserver →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
