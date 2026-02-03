"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, Spinner, EmptyState } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";
import { formatPrice, formatDateTimeFr } from "@/lib/date-utils";

export default function DashboardPage() {
  const [business, setBusiness] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/dashboard/business"),
      api.get("/api/dashboard/bookings?limit=5"),
    ])
      .then(([biz, bk]) => {
        setBusiness(biz);
        setBookings(bk);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (!business) {
    return (
      <EmptyState
        title="Bienvenue sur GaragistePro !"
        description="Commencez par créer votre fiche garage pour recevoir des réservations."
        action={
          <Link href="/dashboard/onboarding">
            <Button size="lg">Créer mon garage</Button>
          </Link>
        }
      />
    );
  }

  const recentBookings = bookings?.items ?? [];
  const totalBookings = bookings?.total ?? 0;
  const pendingCount = recentBookings.filter((b: any) => b.status === "PENDING").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Bonjour, {business.name} 👋</h1>
      <p className="text-muted-foreground">Voici votre activité récente.</p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total réservations", value: totalBookings, icon: "📅" },
          { label: "En attente", value: pendingCount, icon: "⏳" },
          { label: "Prestations actives", value: business.services?.filter((s: any) => s.isActive).length ?? 0, icon: "🔧" },
          { label: "Statut", value: business.isActive ? "En ligne" : "Hors ligne", icon: "🟢" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dernières réservations</h2>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="sm">Voir tout →</Button>
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucune réservation pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
                <div>
                  <div className="font-medium">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.service?.name} — {formatDateTimeFr(new Date(booking.startTime), business.timezone ?? "Europe/Paris")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary">{formatPrice(booking.priceCents)}</span>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
