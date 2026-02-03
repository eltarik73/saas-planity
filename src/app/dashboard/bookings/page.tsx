"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/forms";
import { StatusBadge, Spinner, EmptyState, ErrorMessage } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";
import { formatPrice, formatDateTimeFr } from "@/lib/date-utils";
import type { BookingStatus } from "@prisma/client";

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
];

const NEXT_STATUS: Record<string, { label: string; status: BookingStatus }[]> = {
  PENDING: [
    { label: "Confirmer", status: "CONFIRMED" },
    { label: "Annuler", status: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Démarrer", status: "IN_PROGRESS" },
    { label: "Annuler", status: "CANCELLED" },
  ],
  IN_PROGRESS: [
    { label: "Terminer", status: "COMPLETED" },
  ],
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [tz, setTz] = useState("Europe/Paris");

  async function load(status?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      const data = await api.get<any>(`/api/dashboard/bookings?${params}`);
      setBookings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<any>("/api/dashboard/business").then((b) => {
      if (b?.timezone) setTz(b.timezone);
    });
    load();
  }, []);

  async function updateStatus(bookingId: string, status: BookingStatus) {
    try {
      await api.patch(`/api/dashboard/bookings/${bookingId}`, { status });
      await load(filter);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const items = bookings?.items ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Réservations</h1>
      <p className="text-muted-foreground">Gérez les réservations de votre garage.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            variant={filter === s.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(s.value);
              load(s.value);
            }}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Aucune réservation" description="Les réservations de vos clients apparaîtront ici." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((b: any) => (
            <Card key={b.id} className="bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{b.clientName}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {b.service?.name} · {formatDateTimeFr(new Date(b.startTime), tz)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      📧 {b.clientEmail} {b.clientPhone && `· 📞 ${b.clientPhone}`}
                    </div>
                    <div className="mt-1 text-sm">
                      🚗 <span className="font-mono">{b.licensePlate}</span>
                      {b.vehicleBrand && ` — ${b.vehicleBrand}`}
                      {b.vehicleModel && ` ${b.vehicleModel}`}
                      {b.vehicleYear && ` (${b.vehicleYear})`}
                      {b.mileage && ` · ${b.mileage.toLocaleString()} km`}
                    </div>
                    {b.clientNote && (
                      <div className="mt-2 rounded bg-muted/50 p-2 text-sm italic">💬 {b.clientNote}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{formatPrice(b.priceCents)}</span>
                    {NEXT_STATUS[b.status]?.map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.status === "CANCELLED" ? "destructive" : "default"}
                        onClick={() => updateStatus(b.id, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
