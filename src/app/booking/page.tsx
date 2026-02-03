"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { PriceTag, DurationTag, Spinner, ErrorMessage } from "@/components/shared/ui-helpers";
import { api, ApiError } from "@/lib/api-client";
import { formatPrice, formatDuration } from "@/lib/date-utils";
import type { BusinessWithServices, AvailableSlot, DaySlots } from "@/lib/types";

// ─── Types ──────────────────────────────────

interface Service {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  priceCents: number;
  durationMin: number;
}

type Step = "service" | "slot" | "vehicle" | "confirm";

const STEPS: { key: Step; label: string }[] = [
  { key: "service", label: "Prestation" },
  { key: "slot", label: "Créneau" },
  { key: "vehicle", label: "Véhicule" },
  { key: "confirm", label: "Confirmation" },
];

// ─── Main Component ─────────────────────────

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const garageSlug = searchParams.get("garage") ?? "";
  const preselectedService = searchParams.get("service") ?? "";

  const [step, setStep] = useState<Step>("service");
  const [garage, setGarage] = useState<BusinessWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  // Vehicle form
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    licensePlate: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    mileage: "",
    clientNote: "",
  });

  // Booking result
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Load garage
  useEffect(() => {
    if (!garageSlug) {
      setError("Aucun garage sélectionné");
      setLoading(false);
      return;
    }
    api
      .get<BusinessWithServices>(`/api/garages/${garageSlug}`)
      .then((g) => {
        setGarage(g);
        if (preselectedService) {
          const svc = g.services.find((s: Service) => s.id === preselectedService);
          if (svc) {
            setSelectedService(svc);
            setStep("slot");
          }
        }
      })
      .catch(() => setError("Garage introuvable"))
      .finally(() => setLoading(false));
  }, [garageSlug, preselectedService]);

  // Load slots when service selected
  const loadSlots = useCallback(
    async (date: string) => {
      if (!garage || !selectedService) return;
      setSlotsLoading(true);
      try {
        const result = await api.get<DaySlots[]>(
          `/api/slots?businessId=${garage.id}&serviceId=${selectedService.id}&date=${date}&days=7`
        );
        setSlots(result);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [garage, selectedService]
  );

  useEffect(() => {
    if (step === "slot" && selectedService) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      loadSlots(today);
    }
  }, [step, selectedService, loadSlots]);

  // Submit booking
  async function handleSubmit() {
    if (!garage || !selectedService || !selectedSlot) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await api.post("/api/bookings", {
        businessId: garage.id,
        serviceId: selectedService.id,
        startTime: selectedSlot.start,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone || undefined,
        licensePlate: form.licensePlate.toUpperCase(),
        vehicleBrand: form.vehicleBrand || undefined,
        vehicleModel: form.vehicleModel || undefined,
        vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        clientNote: form.clientNote || undefined,
      });
      setBookingResult(result);
      setStep("confirm");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Ce créneau vient d'être réservé. Veuillez en choisir un autre.");
        setStep("slot");
        loadSlots(selectedDate);
      } else {
        setError((err as Error).message || "Erreur lors de la réservation");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);
  const updateField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (loading) return <Spinner className="py-32" />;
  if (!garage) return <ErrorMessage message={error || "Garage introuvable"} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    i <= currentStepIdx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStepIdx ? "✓" : i + 1}
                </div>
                <span className="mt-1.5 hidden text-xs font-medium sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${i < currentStepIdx ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {error && step !== "confirm" && (
            <div className="mb-6">
              <ErrorMessage message={error} retry={() => setError("")} />
            </div>
          )}

          {/* Step 1: Service */}
          {step === "service" && (
            <div>
              <h1 className="text-2xl font-bold">Choisissez votre prestation</h1>
              <p className="mt-1 text-muted-foreground">Chez {garage.name}</p>
              <div className="mt-6 space-y-3">
                {garage.services.map((svc: Service) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep("slot");
                    }}
                    className="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div>
                      <div className="font-medium">{svc.name}</div>
                      {svc.description && <div className="mt-0.5 text-sm text-muted-foreground">{svc.description}</div>}
                      <DurationTag minutes={svc.durationMin} className="mt-1 text-xs" />
                    </div>
                    <PriceTag cents={svc.priceCents} className="text-lg" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Slot */}
          {step === "slot" && (
            <div>
              <h1 className="text-2xl font-bold">Choisissez votre créneau</h1>
              <p className="mt-1 text-muted-foreground">{selectedService?.name}</p>

              {slotsLoading ? (
                <Spinner className="py-16" />
              ) : (
                <div className="mt-6 space-y-6">
                  {slots.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">Aucun créneau disponible cette semaine.</p>
                  ) : (
                    slots.map((day) => (
                      <div key={day.date}>
                        <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{day.dayLabel}</h3>
                        {day.slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground/60">Aucun créneau</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {day.slots.map((slot) => (
                              <button
                                key={slot.start}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setStep("vehicle");
                                }}
                                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 ${
                                  selectedSlot?.start === slot.start
                                    ? "border-primary bg-primary/10 text-primary"
                                    : ""
                                }`}
                              >
                                {slot.startLocal}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextWeek = new Date(selectedDate);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      const next = nextWeek.toISOString().split("T")[0];
                      setSelectedDate(next);
                      loadSlots(next);
                    }}
                  >
                    Semaine suivante →
                  </Button>
                </div>
              )}

              <Button variant="ghost" onClick={() => setStep("service")} className="mt-4">
                ← Changer de prestation
              </Button>
            </div>
          )}

          {/* Step 3: Vehicle + Contact */}
          {step === "vehicle" && (
            <div>
              <h1 className="text-2xl font-bold">Vos informations</h1>
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="clientName">Nom complet *</Label>
                    <Input id="clientName" value={form.clientName} onChange={updateField("clientName")} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input id="clientEmail" type="email" value={form.clientEmail} onChange={updateField("clientEmail")} required className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientPhone">Téléphone</Label>
                  <Input id="clientPhone" type="tel" value={form.clientPhone} onChange={updateField("clientPhone")} className="mt-1" />
                </div>

                <div className="border-t pt-5">
                  <h2 className="mb-4 text-lg font-semibold">Véhicule</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="licensePlate">Plaque d'immatriculation *</Label>
                      <Input
                        id="licensePlate"
                        placeholder="AA-123-BB"
                        value={form.licensePlate}
                        onChange={updateField("licensePlate")}
                        required
                        className="mt-1 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleBrand">Marque</Label>
                      <Input id="vehicleBrand" placeholder="Renault" value={form.vehicleBrand} onChange={updateField("vehicleBrand")} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Modèle</Label>
                      <Input id="vehicleModel" placeholder="Clio" value={form.vehicleModel} onChange={updateField("vehicleModel")} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Année</Label>
                      <Input id="vehicleYear" type="number" placeholder="2020" value={form.vehicleYear} onChange={updateField("vehicleYear")} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="mileage">Kilométrage</Label>
                      <Input id="mileage" type="number" placeholder="85000" value={form.mileage} onChange={updateField("mileage")} className="mt-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="clientNote">Message au garagiste</Label>
                  <Textarea
                    id="clientNote"
                    placeholder="Précisions, symptômes, demandes particulières…"
                    value={form.clientNote}
                    onChange={updateField("clientNote")}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("slot")}>← Retour</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!form.clientName || !form.clientEmail || !form.licensePlate || submitting}
                    className="flex-1"
                    size="lg"
                  >
                    {submitting ? "Réservation en cours…" : "Confirmer la réservation"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirm" && bookingResult && (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
                ✅
              </div>
              <h1 className="mt-6 text-2xl font-bold text-emerald-700">Réservation confirmée !</h1>
              <p className="mt-2 text-muted-foreground">
                Un email de confirmation a été envoyé à {form.clientEmail}.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button variant="outline" onClick={() => router.push(`/garage/${garageSlug}`)}>
                  Retour au garage
                </Button>
                <Button onClick={() => router.push("/")}>Accueil</Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Booking Summary (always visible) */}
        {step !== "confirm" && (
          <div className="mt-8 lg:mt-0">
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <h3 className="font-semibold">Récapitulatif</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garage</span>
                    <span className="font-medium">{garage.name}</span>
                  </div>
                  {selectedService && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prestation</span>
                        <span className="font-medium">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durée</span>
                        <span>{formatDuration(selectedService.durationMin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix</span>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(selectedService.priceCents)}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedSlot && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-muted-foreground">Créneau</span>
                      <span className="font-medium">{selectedSlot.startLocal}</span>
                    </div>
                  )}
                  {form.licensePlate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Véhicule</span>
                      <span className="font-mono text-xs">{form.licensePlate.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
