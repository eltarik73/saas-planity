// ─── Feature Flags ──────────────────────────
// Read from env, can be overridden per-environment.

export const featureFlags = {
  paymentsEnabled:
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true",
  vehicleLookupEnabled:
    process.env.NEXT_PUBLIC_VEHICLE_LOOKUP_ENABLED === "true",
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
