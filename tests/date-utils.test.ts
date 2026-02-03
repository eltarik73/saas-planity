import { describe, it, expect } from "vitest";
import {
  SLOT_STEP_MINUTES,
  parseTime,
  formatPrice,
  formatDuration,
  formatTimeLocal,
  formatDateLocal,
  getDayOfWeek,
} from "@/lib/date-utils";

describe("parseTime", () => {
  it("parses HH:MM format", () => {
    expect(parseTime("08:30")).toEqual({ hours: 8, minutes: 30 });
    expect(parseTime("18:00")).toEqual({ hours: 18, minutes: 0 });
    expect(parseTime("00:00")).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("formatPrice", () => {
  it("formats cents to EUR", () => {
    expect(formatPrice(7900)).toMatch(/79[,.]00/);
    expect(formatPrice(14900)).toMatch(/149[,.]00/);
    expect(formatPrice(0)).toMatch(/0[,.]00/);
    expect(formatPrice(50)).toMatch(/0[,.]50/);
  });
});

describe("formatDuration", () => {
  it("formats minutes to human readable", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(150)).toBe("2h30");
  });
});

describe("SLOT_STEP_MINUTES", () => {
  it("is 30 minutes", () => {
    expect(SLOT_STEP_MINUTES).toBe(30);
  });
});

describe("formatTimeLocal", () => {
  it("formats a UTC date to local time string", () => {
    // 14:00 UTC = 15:00 Paris (CET) or 16:00 (CEST)
    const date = new Date("2026-01-15T14:00:00Z");
    const result = formatTimeLocal(date, "Europe/Paris");
    expect(result).toMatch(/15:00/);
  });
});

describe("formatDateLocal", () => {
  it("formats a UTC date to local YYYY-MM-DD", () => {
    const date = new Date("2026-03-15T23:30:00Z");
    // 23:30 UTC in Paris (CET+1) = 2026-03-16 00:30
    const result = formatDateLocal(date, "Europe/Paris");
    expect(result).toBe("2026-03-16");
  });
});

describe("getDayOfWeek", () => {
  it("returns correct DayOfWeek enum for a date", () => {
    // 2026-03-16 is a Monday
    const date = new Date("2026-03-16T10:00:00Z");
    expect(getDayOfWeek(date, "Europe/Paris")).toBe("MONDAY");
  });

  it("returns SUNDAY for a Sunday", () => {
    // 2026-03-15 is a Sunday
    const date = new Date("2026-03-15T10:00:00Z");
    expect(getDayOfWeek(date, "Europe/Paris")).toBe("SUNDAY");
  });
});
