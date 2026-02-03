import { z } from "zod";

// ─── Business ───────────────────────────────

export const businessCreateSchema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug : lettres minuscules, chiffres et tirets"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal à 5 chiffres"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().default("Europe/Paris"),
});

export const businessUpdateSchema = businessCreateSchema.partial();

export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;

// ─── Service (Prestation) ───────────────────

export const serviceCreateSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  category: z.string().min(2, "Catégorie requise"),
  description: z.string().optional(),
  priceCents: z.number().int().positive("Prix requis"),
  durationMin: z
    .number()
    .int()
    .min(30, "Durée minimum 30 min")
    .multipleOf(30, "Durée par pas de 30 min"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ─── Business Hours ─────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const businessHoursSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  openTime: z.string().regex(timeRegex, "Format HH:mm requis"),
  closeTime: z.string().regex(timeRegex, "Format HH:mm requis"),
  isClosed: z.boolean().default(false),
});

export const businessHoursBulkSchema = z.array(businessHoursSchema);

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;

// ─── Business Hours Exception ───────────────

export const hoursExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  openTime: z.string().regex(timeRegex).optional(),
  closeTime: z.string().regex(timeRegex).optional(),
  isClosed: z.boolean().default(true),
  reason: z.string().optional(),
});

export type HoursExceptionInput = z.infer<typeof hoursExceptionSchema>;

// ─── Booking ────────────────────────────────

const licensePlateRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;

export const bookingCreateSchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  startTime: z.string().datetime({ message: "Date ISO requise" }),

  // Client
  clientName: z.string().min(2, "Nom requis"),
  clientEmail: z.string().email("Email invalide"),
  clientPhone: z.string().optional(),

  // Véhicule
  licensePlate: z
    .string()
    .toUpperCase()
    .regex(licensePlateRegex, "Format plaque : AA-123-BB"),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(2030).optional(),
  mileage: z.number().int().positive().optional(),

  // Message
  clientNote: z.string().max(1000).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  internalNote: z.string().optional(),
});

export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;

// ─── Search / Filter ────────────────────────

export const garageSearchSchema = z.object({
  city: z.string().optional(),
  service: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type GarageSearchInput = z.infer<typeof garageSearchSchema>;
