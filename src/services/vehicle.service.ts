import { isFeatureEnabled } from "@/lib/feature-flags";

// ─── Types ──────────────────────────────────

export interface VehicleInfo {
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
}

// ─── Service ────────────────────────────────

export const VehicleService = {
  /**
   * Recherche véhicule par plaque d'immatriculation.
   * Retourne null si feature désactivée ou plaque inconnue.
   */
  async lookupByPlate(licensePlate: string): Promise<VehicleInfo | null> {
    if (!isFeatureEnabled("vehicleLookupEnabled")) {
      return null;
    }

    const apiUrl = process.env.VEHICLE_LOOKUP_API_URL;
    const apiKey = process.env.VEHICLE_LOOKUP_API_KEY;

    if (!apiUrl || !apiKey) {
      console.warn("[Vehicle] API non configurée");
      return null;
    }

    try {
      const normalized = licensePlate.toUpperCase().replace(/\s+/g, "");

      const response = await fetch(
        `${apiUrl}?plate=${encodeURIComponent(normalized)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000), // timeout 5s
        }
      );

      if (!response.ok) {
        console.warn("[Vehicle] Lookup failed:", response.status);
        return null;
      }

      const data = await response.json();

      return {
        licensePlate: normalized,
        brand: data.brand ?? data.make ?? null,
        model: data.model ?? null,
        year: data.year ? Number(data.year) : null,
      };
    } catch (err) {
      console.error("[Vehicle] Lookup error:", err);
      return null;
    }
  },
};
