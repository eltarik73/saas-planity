import { describe, it, expect } from "vitest";
import {
  bookingCreateSchema,
  businessCreateSchema,
  serviceCreateSchema,
  businessHoursSchema,
} from "@/lib/validations";

describe("bookingCreateSchema", () => {
  const valid = {
    businessId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    serviceId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    startTime: "2026-03-15T09:00:00Z",
    clientName: "Marie Martin",
    clientEmail: "marie@email.fr",
    licensePlate: "AB-123-CD",
  };

  it("accepts valid booking input", () => {
    const result = bookingCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("requires clientName", () => {
    const result = bookingCreateSchema.safeParse({ ...valid, clientName: "" });
    expect(result.success).toBe(false);
  });

  it("requires valid email", () => {
    const result = bookingCreateSchema.safeParse({ ...valid, clientEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("requires licensePlate", () => {
    const result = bookingCreateSchema.safeParse({ ...valid, licensePlate: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = bookingCreateSchema.safeParse({
      ...valid,
      clientPhone: "06 12 34 56 78",
      vehicleBrand: "Renault",
      vehicleModel: "Clio",
      vehicleYear: 2021,
      mileage: 45000,
      clientNote: "Voyant moteur allumé",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vehicleBrand).toBe("Renault");
      expect(result.data.mileage).toBe(45000);
    }
  });

  it("rejects vehicleYear outside range", () => {
    const result = bookingCreateSchema.safeParse({ ...valid, vehicleYear: 1899 });
    expect(result.success).toBe(false);
  });
});

describe("businessCreateSchema", () => {
  const valid = {
    name: "Garage Dupont",
    slug: "garage-dupont",
    address: "42 rue de la République",
    city: "Lyon",
    postalCode: "69002",
  };

  it("accepts valid business input", () => {
    const result = businessCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = businessCreateSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("requires slug", () => {
    const result = businessCreateSchema.safeParse({ ...valid, slug: "" });
    expect(result.success).toBe(false);
  });

  it("requires postalCode", () => {
    const result = businessCreateSchema.safeParse({ ...valid, postalCode: "" });
    expect(result.success).toBe(false);
  });
});

describe("serviceCreateSchema", () => {
  it("accepts valid service input", () => {
    const result = serviceCreateSchema.safeParse({
      name: "Vidange",
      category: "Entretien",
      priceCents: 7900,
      durationMin: 60,
    });
    expect(result.success).toBe(true);
  });

  it("rejects priceCents = 0", () => {
    const result = serviceCreateSchema.safeParse({
      name: "Vidange",
      category: "Entretien",
      priceCents: 0,
      durationMin: 60,
    });
    expect(result.success).toBe(false);
  });

  it("rejects durationMin < 30", () => {
    const result = serviceCreateSchema.safeParse({
      name: "Vidange",
      category: "Entretien",
      priceCents: 7900,
      durationMin: 15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects durationMin not multiple of 30", () => {
    const result = serviceCreateSchema.safeParse({
      name: "Vidange",
      category: "Entretien",
      priceCents: 7900,
      durationMin: 45,
    });
    expect(result.success).toBe(false);
  });
});

describe("businessHoursSchema", () => {
  it("accepts valid hours", () => {
    const result = businessHoursSchema.safeParse({
      dayOfWeek: "MONDAY",
      openTime: "08:00",
      closeTime: "18:00",
      isClosed: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts closed day", () => {
    const result = businessHoursSchema.safeParse({
      dayOfWeek: "SUNDAY",
      openTime: "08:00",
      closeTime: "18:00",
      isClosed: true,
    });
    expect(result.success).toBe(true);
  });
});
