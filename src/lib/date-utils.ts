import {
  addMinutes,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { DayOfWeek } from "@prisma/client";

// ─── Constants ──────────────────────────────

export const SLOT_STEP_MINUTES = 30;
export const DEFAULT_TIMEZONE = "Europe/Paris";

// ─── Day Mapping ────────────────────────────

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function getDayOfWeek(date: Date, timezone: string): DayOfWeek {
  const zoned = toZonedTime(date, timezone);
  return DAY_MAP[zoned.getDay()];
}

// ─── Time Parsing ───────────────────────────

/** Parse "HH:mm" string into hours and minutes */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h, minutes: m };
}

/** Create a Date from a date and a "HH:mm" string in a given timezone */
export function timeToDate(
  baseDate: Date,
  time: string,
  timezone: string
): Date {
  const { hours, minutes } = parseTime(time);
  const zoned = toZonedTime(baseDate, timezone);
  const withTime = setMinutes(setHours(startOfDay(zoned), hours), minutes);
  return fromZonedTime(withTime, timezone); // → UTC
}

// ─── Slot Types ─────────────────────────────

export interface TimeSlot {
  start: Date; // UTC
  end: Date; // UTC
  startLocal: string; // "HH:mm" in business timezone
}

export interface BookingRange {
  startTime: Date;
  endTime: Date;
}

// ─── Overlap Check ──────────────────────────

export function hasOverlap(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: BookingRange[]
): boolean {
  return existingBookings.some(
    (b) => isBefore(slotStart, b.endTime) && isAfter(slotEnd, b.startTime)
  );
}

// ─── Format Helpers ─────────────────────────

export function formatTimeLocal(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "HH:mm");
}

export function formatDateLocal(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "yyyy-MM-dd");
}

export function formatDateFr(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "dd/MM/yyyy");
}

export function formatDateTimeFr(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "dd/MM/yyyy HH:mm");
}

// ─── Price Formatting ───────────────────────

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}
