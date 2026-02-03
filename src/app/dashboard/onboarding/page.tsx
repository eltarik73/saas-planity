"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { ErrorMessage } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const updateField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      [key]: val,
      ...(key === "name" && !prev.slug ? { slug: generateSlug(val) } : {}),
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/api/dashboard/business", {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
      });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Bienvenue sur GaragistePro 🚀</h1>
        <p className="mt-2 text-muted-foreground">
          Créez votre fiche garage en quelques minutes et commencez à recevoir des réservations.
        </p>
      </div>

      {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

      <Card>
        <CardHeader>
          <CardTitle>Informations de votre garage</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom du garage *</Label>
              <Input value={form.name} onChange={updateField("name")} placeholder="Garage Dupont" required className="mt-1" />
            </div>
            <div>
              <Label>URL de votre page (slug) *</Label>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <span>garagistepro.fr/garage/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="garage-dupont"
                  required
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={updateField("description")} placeholder="Garage multimarque spécialisé…" className="mt-1" rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={updateField("phone")} placeholder="01 23 45 67 89" className="mt-1" />
              </div>
              <div>
                <Label>Email de contact</Label>
                <Input value={form.email} onChange={updateField("email")} type="email" placeholder="contact@garage.fr" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Adresse *</Label>
              <Input value={form.address} onChange={updateField("address")} placeholder="12 rue de la Mécanique" required className="mt-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ville *</Label>
                <Input value={form.city} onChange={updateField("city")} placeholder="Lyon" required className="mt-1" />
              </div>
              <div>
                <Label>Code postal *</Label>
                <Input value={form.postalCode} onChange={updateField("postalCode")} placeholder="69001" required className="mt-1" />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={saving}>
              {saving ? "Création en cours…" : "Créer mon garage"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
