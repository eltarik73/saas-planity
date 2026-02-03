import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/shared/search-form";

export const metadata = buildMetadata({
  title: "Réservation garage auto en ligne",
  description:
    "Trouvez et réservez en ligne votre créneau dans les meilleurs garages auto près de chez vous. Rapide, simple, garanti.",
  path: "/",
});

async function getStats() {
  const [garageCount, bookingCount] = await Promise.all([
    prisma.business.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
  ]);
  return { garageCount, bookingCount };
}

async function getFeaturedCities() {
  const results = await prisma.business.groupBy({
    by: ["city"],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });
  return results.map((r) => ({ city: r.city, count: r._count.id }));
}

export default async function HomePage() {
  const [stats, cities] = await Promise.all([getStats(), getFeaturedCities()]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Votre garage auto,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                en un clic
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-blue-100/80">
              Trouvez le meilleur garage près de chez vous, choisissez votre prestation
              et réservez votre créneau en moins de 2 minutes. Sans appel, sans attente.
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-2xl">
            <SearchForm />
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 flex max-w-lg justify-center gap-12 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats.garageCount}+</div>
              <div className="text-sm text-blue-200/70">Garages partenaires</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.bookingCount}+</div>
              <div className="text-sm text-blue-200/70">Réservations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">&lt; 2 min</div>
              <div className="text-sm text-blue-200/70">Pour réserver</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">Comment ça marche</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Trois étapes simples pour réserver votre créneau garage.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Trouvez votre garage",
              desc: "Recherchez par ville ou par prestation. Comparez les garages, leurs avis et leurs tarifs.",
              icon: "🔍",
            },
            {
              step: "2",
              title: "Choisissez votre créneau",
              desc: "Sélectionnez la prestation souhaitée et le créneau qui vous arrange. Disponibilités en temps réel.",
              icon: "📅",
            },
            {
              step: "3",
              title: "Confirmez en ligne",
              desc: "Renseignez votre véhicule, confirmez et recevez votre confirmation par email instantanément.",
              icon: "✅",
            },
          ].map((item) => (
            <div key={item.step} className="group relative rounded-xl border bg-card p-8 text-center transition-shadow hover:shadow-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities */}
      {cities.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight">Garages par ville</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {cities.map(({ city, count }) => (
                <Link
                  key={city}
                  href={`/garages/${encodeURIComponent(city.toLowerCase())}`}
                  className="group rounded-lg border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="font-semibold group-hover:text-primary">{city}</div>
                  <div className="text-sm text-muted-foreground">
                    {count} garage{count > 1 ? "s" : ""}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Pro */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground">Vous êtes garagiste ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100/90">
            Chaque créneau vide est un manque à gagner. Rejoignez GaragistePro et
            remplissez votre planning sans effort — vos clients réservent en ligne 24h/24.
          </p>
          <Link href="/sign-up" className="mt-8 inline-block">
            <Button size="xl" variant="secondary" className="font-semibold">
              Inscrire mon garage gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
