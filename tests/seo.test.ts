import { describe, it, expect } from "vitest";
import { cityToSlug, slugToDisplay, buildGarageJsonLd } from "@/lib/seo";

describe("cityToSlug", () => {
  it("converts city name to URL slug", () => {
    expect(cityToSlug("Lyon")).toBe("lyon");
    expect(cityToSlug("Saint-Étienne")).toBe("saint-etienne");
    expect(cityToSlug("Aix en Provence")).toBe("aix-en-provence");
    expect(cityToSlug("Paris")).toBe("paris");
  });
});

describe("slugToDisplay", () => {
  it("converts slug back to display name", () => {
    expect(slugToDisplay("lyon")).toBe("Lyon");
    expect(slugToDisplay("saint-etienne")).toBe("Saint Etienne");
    expect(slugToDisplay("aix-en-provence")).toBe("Aix En Provence");
  });
});

describe("buildGarageJsonLd", () => {
  it("generates valid JSON-LD for a garage", () => {
    const jsonLd = buildGarageJsonLd({
      name: "Garage Dupont",
      address: "42 rue de la République",
      city: "Lyon",
      postalCode: "69002",
      slug: "garage-dupont-lyon",
      phone: "04 78 12 34 56",
    });

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("AutoRepair");
    expect(jsonLd.name).toBe("Garage Dupont");
    expect(jsonLd.address.addressLocality).toBe("Lyon");
    expect(jsonLd.telephone).toBe("04 78 12 34 56");
  });

  it("omits optional fields when not provided", () => {
    const jsonLd = buildGarageJsonLd({
      name: "Test Garage",
      address: "1 rue Test",
      city: "Paris",
      postalCode: "75001",
      slug: "test-garage",
    });

    expect(jsonLd.telephone).toBeUndefined();
    expect(jsonLd.image).toBeUndefined();
  });
});
