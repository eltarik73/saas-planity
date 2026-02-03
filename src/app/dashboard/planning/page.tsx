"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge, Spinner } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";
import { formatPrice, formatTimeLocal } from "@/lib/date-utils";
import { addDays, startOfWeek, format } from "date-fns";
import { fr } from "date-fns/locale";

const HOURS = Array.from({ length: 22 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`).filter(
  (_, i) => i < 12
); // 07:00 to 18:00

export default function PlanningPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tz, setTz] = useState("Europe/Paris");

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    api.get<any>("/api/dashboard/business").then((b) => {
      if (b?.timezone) setTz(b.timezone);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const ws = format(weekStart, "yyyy-MM-dd");
    api
      .get<any[]>(`/api/dashboard/planning?weekStart=${ws}`)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekStart]);

  function getBookingsForDay(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    return bookings.filter((b) => {
      const bDate = format(new Date(b.startTime), "yyyy-MM-dd");
      return bDate === dayStr;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-muted-foreground">Vue hebdomadaire de vos rendez-vous.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>
            ← Sem. préc.
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>
            Sem. suiv. →
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="grid min-w-[800px] grid-cols-6 gap-3">
            {days.map((day) => {
              const dayBookings = getBookingsForDay(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-lg border p-3 ${isToday ? "border-primary/40 bg-primary/5" : "bg-white"}`}
                >
                  <div className="mb-3 text-center">
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                      {format(day, "EEEE", { locale: fr })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d MMM", { locale: fr })}
                    </div>
                  </div>

                  {dayBookings.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Aucun RDV</p>
                  ) : (
                    <div className="space-y-2">
                      {dayBookings.map((b: any) => (
                        <div
                          key={b.id}
                          className="rounded-md border bg-card p-2.5 text-xs shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {formatTimeLocal(new Date(b.startTime), tz)}
                            </span>
                            <StatusBadge status={b.status} />
                          </div>
                          <div className="mt-1 font-medium">{b.clientName}</div>
                          <div className="text-muted-foreground">{b.service?.name}</div>
                          <div className="mt-0.5 font-mono text-muted-foreground">{b.licensePlate}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
