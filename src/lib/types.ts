import type {
  Business,
  Service,
  Booking,
  BusinessHours,
  BusinessHoursException,
  BookingStatus,
  PaymentMode,
  PaymentStatus,
} from "@prisma/client";

// ─── Re-exports for convenience ─────────────

export type {
  Business,
  Service,
  Booking,
  BusinessHours,
  BusinessHoursException,
  BookingStatus,
  PaymentMode,
  PaymentStatus,
};

// ─── Business with relations ────────────────

export type BusinessWithServices = Business & {
  services: Service[];
};

export type BusinessFull = Business & {
  services: Service[];
  businessHours: BusinessHours[];
  hoursExceptions: BusinessHoursException[];
};

// ─── Booking with relations ─────────────────

export type BookingWithRelations = Booking & {
  business: Business;
  service: Service;
};

// ─── API Response Types ─────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Booking Wizard State ───────────────────

export interface BookingWizardState {
  step: "service" | "slot" | "vehicle" | "payment" | "confirmation";
  businessId: string;
  serviceId?: string;
  startTime?: string; // ISO string
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  licensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  mileage?: number;
  clientNote?: string;
}

// ─── Slot Types ─────────────────────────────

export interface AvailableSlot {
  start: string; // ISO string (UTC)
  end: string; // ISO string (UTC)
  startLocal: string; // "HH:mm" in business tz
}

export interface DaySlots {
  date: string; // "YYYY-MM-DD"
  dayLabel: string; // "Lundi 15 jan."
  slots: AvailableSlot[];
}
