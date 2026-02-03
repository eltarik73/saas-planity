"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { Spinner, ErrorMessage } from "@/components/shared/ui-helpers";
import { api } from "@/lib/api-client";

export default function SettingsPage() {
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    api
      .get<any>("/api/dashboard/business")
      .then((b) => {
        if (b) {
          setBiz(b);
          setForm({
            name: b.name ?? "",
            description: b.description ?? "",
            phone: b.phone ?? "",
            email: b.email ?? "",
            address: b.address ?? "",
            city: b.city ?? "",
            postalCode: b.postalCode ?? "",
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.patch("/api/dashboard/business", {
        name: form.name,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (!biz) return <ErrorMessage message="Aucun garage trouvé" />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <p className="text-muted-foreground">Informations de votre garage.</p>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
      {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">✅ Modifications enregistrées</div>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom du garage *</Label>
              <Input value={form.name} onChange={updateField("name")} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={updateField("description")} className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={updateField("phone")} className="mt-1" />
            </div>
            <div>
              <Label>Email de contact</Label>
              <Input value={form.email} onChange={updateField("email")} type="email" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Adresse *</Label>
              <Input value={form.address} onChange={updateField("address")} className="mt-1" />
            </div>
            <div>
              <Label>Ville *</Label>
              <Input value={form.city} onChange={updateField("city")} className="mt-1" />
            </div>
            <div>
              <Label>Code postal *</Label>
              <Input value={form.postalCode} onChange={updateField("postalCode")} className="mt-1" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Votre page publique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Votre garage est accessible à l'adresse :
          </p>
          <a
            href={`/garage/${biz.slug}`}
            target="_blank"
            rel="noopener"
            className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
          >
            {process.env.NEXT_PUBLIC_APP_URL ?? ""}/garage/{biz.slug}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
