import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("feature flags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("paymentsEnabled defaults to false", async () => {
    delete process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("paymentsEnabled")).toBe(false);
  });

  it("paymentsEnabled returns true when env is 'true'", async () => {
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED = "true";
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("paymentsEnabled")).toBe(true);
  });

  it("vehicleLookupEnabled defaults to false", async () => {
    delete process.env.NEXT_PUBLIC_VEHICLE_LOOKUP_ENABLED;
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("vehicleLookupEnabled")).toBe(false);
  });
});
