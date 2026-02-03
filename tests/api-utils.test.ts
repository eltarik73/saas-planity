import { describe, it, expect } from "vitest";
import {
  apiSuccess,
  apiError,
  apiConflict,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api-utils";

describe("API response helpers", () => {
  it("apiSuccess returns 200 with data", async () => {
    const res = apiSuccess({ id: "123", name: "Test" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("123");
  });

  it("apiSuccess with custom status code", async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("apiError returns error response", async () => {
    const res = apiError("Something went wrong", 400);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Something went wrong");
  });

  it("apiConflict returns 409", async () => {
    const res = apiConflict("Créneau déjà réservé");
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toBe("Créneau déjà réservé");
  });

  it("apiUnauthorized returns 401", async () => {
    const res = apiUnauthorized();
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("apiNotFound returns 404", async () => {
    const res = apiNotFound("Garage introuvable");
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error).toBe("Garage introuvable");
  });
});
