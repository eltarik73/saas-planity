"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/forms";
import { Spinner, ErrorMessage } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";

const DAYS = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" },
];

interface DayHours {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export default function HoursPage() {
  const [hours, setHours] = useState<DayHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Exceptions
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [excForm, setExcForm] = useState({ date: "", isClosed: true, openTime: "", closeTime: "", reason: "" });

  useEffect(() => {
    api
      .get<any>("/api/dashboard/business")
      .then((biz) => {
        if (biz?.businessHours?.length > 0) {
          const mapped = DAYS.map((d) => {
            const found = biz.businessHours.find((h: any) => h.dayOfWeek === d.value);
            return found
              ? { dayOfWeek: d.value, openTime: found.openTime, closeTime: found.closeTime, isClosed: found.isClosed }
              : { dayOfWeek: d.value, openTime: "08:00", closeTime: "18:00", isClosed: d.value === "SUNDAY" };
          });
          setHours(mapped);
        } else {
          setHours(
            DAYS.map((d) => ({
              dayOfWeek: d.value,
              openTime: "08:00",
              closeTime: "18:00",
              isClosed: d.value === "SUNDAY",
            }))
          );
        }
        setExceptions(biz?.hoursExceptions ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function updateDay(idx: number, field: string, value: any) {
    setHours((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.put("/api/dashboard/hours", hours);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addException() {
    if (!excForm.date) return;
    try {
      await api.post("/api/dashboard/exceptions", {
        date: excForm.date,
        isClosed: excForm.isClosed,
        openTime: excForm.isClosed ? undefined : excForm.openTime || undefined,
        closeTime: excForm.isClosed ? undefined : excForm.closeTime || undefined,
        reason: excForm.reason || undefined,
      });
      // Reload
      const biz = await api.get<any>("/api/dashboard/business");
      setExceptions(biz?.hoursExceptions ?? []);
      setExcForm({ date: "", isClosed: true, openTime: "", closeTime: "", reason: "" });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteException(id: string) {
    try {
      await api.del(`/api/dashboard/exceptions/${id}`);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Horaires d'ouverture</h1>
      <p className="text-muted-foreground">Définissez vos horaires et jours de fermeture.</p>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
      {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">✅ Horaires enregistrés</div>}

      {/* Weekly hours */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Horaires hebdomadaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hours.map((day, idx) => {
              const label = DAYS.find((d) => d.value === day.dayOfWeek)?.label ?? day.dayOfWeek;
              return (
                <div key={day.dayOfWeek} className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-medium">{label}</span>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(e) => updateDay(idx, "isClosed", e.target.checked)}
                      className="rounded"
                    />
                    Fermé
                  </label>
                  {!day.isClosed && (
                    <>
                      <Input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateDay(idx, "openTime", e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">à</span>
                      <Input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateDay(idx, "closeTime", e.target.value)}
                        className="w-28"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? "Enregistrement…" : "Enregistrer les horaires"}
          </Button>
        </CardContent>
      </Card>

      {/* Exceptions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Jours exceptionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={excForm.date} onChange={(e) => setExcForm((p) => ({ ...p, date: e.target.value }))} className="mt-1" />
            </div>
            <label className="flex items-center gap-1.5 pb-2 text-sm">
              <input type="checkbox" checked={excForm.isClosed} onChange={(e) => setExcForm((p) => ({ ...p, isClosed: e.target.checked }))} className="rounded" />
              Fermé
            </label>
            {!excForm.isClosed && (
              <>
                <div>
                  <Label className="text-xs">Ouverture</Label>
                  <Input type="time" value={excForm.openTime} onChange={(e) => setExcForm((p) => ({ ...p, openTime: e.target.value }))} className="mt-1 w-28" />
                </div>
                <div>
                  <Label className="text-xs">Fermeture</Label>
                  <Input type="time" value={excForm.closeTime} onChange={(e) => setExcForm((p) => ({ ...p, closeTime: e.target.value }))} className="mt-1 w-28" />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">Raison</Label>
              <Input value={excForm.reason} onChange={(e) => setExcForm((p) => ({ ...p, reason: e.target.value }))} className="mt-1" placeholder="Congés…" />
            </div>
            <Button onClick={addException} size="sm">Ajouter</Button>
          </div>

          {exceptions.length > 0 && (
            <div className="mt-4 space-y-2">
              {exceptions.map((exc: any) => (
                <div key={exc.id} className="flex items-center justify-between rounded border p-3 text-sm">
                  <div>
                    <span className="font-medium">{new Date(exc.date).toLocaleDateString("fr-FR")}</span>
                    {exc.isClosed ? (
                      <span className="ml-2 text-destructive">Fermé</span>
                    ) : (
                      <span className="ml-2">{exc.openTime} – {exc.closeTime}</span>
                    )}
                    {exc.reason && <span className="ml-2 text-muted-foreground">({exc.reason})</span>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteException(exc.id)}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
