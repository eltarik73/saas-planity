import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, buildGarageJsonLd } from "@/lib/seo";
import { formatPrice, formatDuration } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Separator } from "@/components/ui/forms";

interface Props {
  params: { slug: string };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug, isActive: true },
  });
  if (!business) return {};

  return buildMetadata({
    title: `${business.name} — Garage auto à ${business.city}`,
    description:
      business.seoDescription ??
      `Réservez en ligne chez ${business.name} à ${business.city}. ${business.description ?? ""}`.trim(),
    path: `/garage/${business.slug}`,
    image: business.coverUrl ?? undefined,
  });
}

export async function generateStaticParams() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return businesses.map((b) => ({ slug: b.slug }));
}

async function getGarage(slug: string) {
  return prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      businessHours: true,
    },
  });
}

export default async function GaragePage({ params }: Props) {
  const garage = await getGarage(params.slug);
  if (!garage) notFound();

  const jsonLd = buildGarageJsonLd({
    name: garage.name,
    description: garage.description ?? undefined,
    address: garage.address,
    city: garage.city,
    postalCode: garage.postalCode,
    phone: garage.phone ?? undefined,
    slug: garage.slug,
    latitude: garage.latitude ?? undefined,
    longitude: garage.longitude ?? undefined,
    image: garage.coverUrl ?? undefined,
  });

  const sortedHours = [...garage.businessHours].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  // Group services by category
  const categories = garage.services.reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, typeof garage.services>
  );

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-slate-100 sm:h-64">
        {garage.coverUrl ? (
          <img src={garage.coverUrl} alt={garage.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl text-blue-200">🔧</div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Main */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight">{garage.name}</h1>
            <p className="mt-2 text-muted-foreground">
              📍 {garage.address}, {garage.postalCode} {garage.city}
            </p>
            {garage.phone && (
              <p className="mt-1 text-muted-foreground">📞 {garage.phone}</p>
            )}

            {garage.description && (
              <p className="mt-4 text-foreground/80">{garage.description}</p>
            )}

            {/* Services */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold">Nos prestations</h2>
              {Object.entries(categories).map(([category, services]) => (
                <div key={category} className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-muted-foreground">{category}</h3>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="mt-0.5 text-sm text-muted-foreground">{service.description}</div>
                          )}
                          <div className="mt-1 text-sm text-muted-foreground">
                            ⏱ {formatDuration(service.durationMin)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(service.priceCents)}
                          </span>
                          <Link
                            href={`/booking?garage=${garage.slug}&service=${service.id}`}
                          >
                            <Button size="sm">Réserver</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-10 lg:mt-0">
            {/* Booking CTA */}
            <Card className="sticky top-20 border-primary/20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Réserver un créneau</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choisissez votre prestation et réservez en ligne en moins de 2 minutes.
                </p>
                <Link href={`/booking?garage=${garage.slug}`}>
                  <Button className="mt-4 w-full" size="lg">
                    Prendre rendez-vous
                  </Button>
                </Link>

                {garage.onlinePaymentEnabled && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    💳 Paiement sécurisé en ligne
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            {sortedHours.length > 0 && (
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Horaires d'ouverture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedHours.map((h) => (
                      <div key={h.dayOfWeek} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{DAY_LABELS[h.dayOfWeek]}</span>
                        <span className={h.isClosed ? "text-destructive" : "font-medium"}>
                          {h.isClosed ? "Fermé" : `${h.openTime} – ${h.closeTime}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
