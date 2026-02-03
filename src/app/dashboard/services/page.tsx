"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { PriceTag, DurationTag, Spinner, EmptyState, ErrorMessage } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";
import { formatPrice, formatDuration } from "@/lib/date-utils";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { name: "", category: "", description: "", priceCents: "", durationMin: "" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // "new" or service id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.get<Service[]>("/api/dashboard/services");
      setServices(data);
    } catch (e) {
      setError("Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(svc?: Service) {
    if (svc) {
      setForm({
        name: svc.name,
        category: svc.category,
        description: svc.description ?? "",
        priceCents: String(svc.priceCents / 100),
        durationMin: String(svc.durationMin),
      });
      setEditing(svc.id);
    } else {
      setForm(EMPTY_FORM);
      setEditing("new");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const data = {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        priceCents: Math.round(Number(form.priceCents) * 100),
        durationMin: Number(form.durationMin),
      };

      if (editing === "new") {
        await api.post("/api/dashboard/services", data);
      } else {
        await api.patch(`/api/dashboard/services/${editing}`, data);
      }
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e.message || "Erreur sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Désactiver cette prestation ?")) return;
    try {
      await api.del(`/api/dashboard/services/${id}`);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const updateField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prestations</h1>
          <p className="text-muted-foreground">Gérez vos prestations et tarifs.</p>
        </div>
        <Button onClick={() => startEdit()}>+ Ajouter</Button>
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      {/* Edit form */}
      {editing && (
        <Card className="mt-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{editing === "new" ? "Nouvelle prestation" : "Modifier"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nom *</Label>
                <Input value={form.name} onChange={updateField("name")} className="mt-1" placeholder="Vidange" />
              </div>
              <div>
                <Label>Catégorie *</Label>
                <Input value={form.category} onChange={updateField("category")} className="mt-1" placeholder="Entretien" />
              </div>
              <div>
                <Label>Prix (€) *</Label>
                <Input type="number" step="0.01" value={form.priceCents} onChange={updateField("priceCents")} className="mt-1" placeholder="49.90" />
              </div>
              <div>
                <Label>Durée (min) *</Label>
                <Input type="number" step="30" min="30" value={form.durationMin} onChange={updateField("durationMin")} className="mt-1" placeholder="60" />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={updateField("description")} className="mt-1" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSave} disabled={saving || !form.name || !form.category || !form.priceCents || !form.durationMin}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services list */}
      {services.length === 0 ? (
        <EmptyState title="Aucune prestation" description="Ajoutez votre première prestation pour commencer." />
      ) : (
        <div className="mt-6 space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`flex items-center justify-between rounded-lg border bg-white p-4 ${!svc.isActive ? "opacity-50" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{svc.name}</span>
                  {!svc.isActive && <span className="text-xs text-destructive">(désactivé)</span>}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {svc.category} · {formatDuration(svc.durationMin)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-primary">{formatPrice(svc.priceCents)}</span>
                <Button variant="ghost" size="sm" onClick={() => startEdit(svc)}>Modifier</Button>
                {svc.isActive && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(svc.id)}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
