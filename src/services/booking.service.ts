import { prisma } from "@/lib/prisma";
import { Prisma, type BookingStatus } from "@prisma/client";
import { addMinutes } from "date-fns";
import type { BookingCreateInput } from "@/lib/validations";
import { assertOwner, NotFoundError } from "./business.service";

// Statuts qui bloquent un créneau
const BLOCKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
];

export class ConflictError extends Error {
  status = 409;
  constructor(msg = "Créneau déjà réservé") {
    super(msg);
    this.name = "ConflictError";
  }
}

export const BookingService = {
  /**
   * ═══════════════════════════════════════════
   * CRÉATION BOOKING — ANTI-DOUBLE BOOKING
   * Transaction SERIALIZABLE obligatoire
   * ═══════════════════════════════════════════
   */
  async create(input: BookingCreateInput, clerkUserId?: string) {
    // 1) Charger service pour durée et prix
    const service = await prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (!service || !service.isActive) {
      throw new NotFoundError("Prestation introuvable ou inactive");
    }

    // 2) Vérifier que le business existe et est actif
    const business = await prisma.business.findUnique({
      where: { id: input.businessId },
    });
    if (!business || !business.isActive) {
      throw new NotFoundError("Garage introuvable ou inactif");
    }

    const startTime = new Date(input.startTime);
    const endTime = addMinutes(startTime, service.durationMin);

    // 3) Déterminer paiement
    let paymentStatus: "NOT_REQUIRED" | "PENDING" = "NOT_REQUIRED";
    let depositCents: number | null = null;
    const priceCents = service.priceCents;

    if (business.onlinePaymentEnabled && business.paymentMode !== "NONE") {
      paymentStatus = "PENDING";
      if (business.paymentMode === "DEPOSIT") {
        if (business.depositAmountCents) {
          depositCents = business.depositAmountCents;
        } else if (business.depositPercent) {
          depositCents = Math.round(
            (priceCents * business.depositPercent) / 100
          );
        }
      } else {
        // FULL
        depositCents = priceCents;
      }
    }

    // ═══════════════════════════════════════
    // 4) TRANSACTION SERIALIZABLE
    // ═══════════════════════════════════════
    const booking = await prisma.$transaction(
      async (tx) => {
        // 4a) Lock: SELECT business FOR UPDATE (row-level lock)
        await tx.$queryRaw`
          SELECT id FROM "Business"
          WHERE id = ${input.businessId}
          FOR UPDATE
        `;

        // 4b) Check overlap sur statuts actifs
        const overlapping = await tx.booking.findFirst({
          where: {
            businessId: input.businessId,
            status: { in: BLOCKING_STATUSES },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        });

        if (overlapping) {
          throw new ConflictError();
        }

        // 4c) Create booking
        return tx.booking.create({
          data: {
            businessId: input.businessId,
            serviceId: input.serviceId,
            clerkUserId: clerkUserId ?? null,
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            clientPhone: input.clientPhone ?? null,
            licensePlate: input.licensePlate,
            vehicleBrand: input.vehicleBrand ?? null,
            vehicleModel: input.vehicleModel ?? null,
            vehicleYear: input.vehicleYear ?? null,
            mileage: input.mileage ?? null,
            startTime,
            endTime,
            status: "PENDING",
            clientNote: input.clientNote ?? null,
            priceCents,
            paymentStatus,
            depositCents,
          },
          include: {
            business: true,
            service: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    return booking;
  },

  /** Mise à jour statut (par le garagiste) */
  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    internalNote: string | undefined,
    clerkUserId: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { businessId: true },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");

    await assertOwner(booking.businessId, clerkUserId);

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(internalNote !== undefined && { internalNote }),
      },
      include: { business: true, service: true },
    });
  },

  /** Annulation par le client */
  async cancel(bookingId: string, clerkUserId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundError("Réservation introuvable");

    // Le client ne peut annuler que ses propres bookings
    if (booking.clerkUserId !== clerkUserId) {
      throw new NotFoundError("Réservation introuvable");
    }

    // Pas d'annulation si déjà terminée
    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status)) {
      throw new Error("Cette réservation ne peut plus être annulée");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: { business: true, service: true },
    });
  },

  /** Liste bookings d'un garage (dashboard pro) */
  async getByBusiness(
    businessId: string,
    clerkUserId: string,
    filters?: {
      status?: BookingStatus;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    await assertOwner(businessId, clerkUserId);

    const where: Prisma.BookingWhereInput = { businessId };

    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.startTime = {};
      if (filters?.from) where.startTime.gte = filters.from;
      if (filters?.to) where.startTime.lte = filters.to;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** Bookings du client connecté */
  async getByUser(clerkUserId: string) {
    return prisma.booking.findMany({
      where: { clerkUserId },
      include: { business: true, service: true },
      orderBy: { startTime: "desc" },
    });
  },

  /** Booking par ID */
  async getById(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true, service: true },
    });
  },

  /** Mise à jour paymentIntentId et statut paiement */
  async updatePayment(
    bookingId: string,
    data: {
      paymentIntentId?: string;
      paymentStatus?: "NOT_REQUIRED" | "PENDING" | "PAID" | "REFUNDED" | "FAILED";
    }
  ) {
    return prisma.booking.update({
      where: { id: bookingId },
      data,
    });
  },

  /** Planning semaine pour un garage (dashboard) */
  async getWeekPlanning(
    businessId: string,
    clerkUserId: string,
    weekStart: Date,
    weekEnd: Date
  ) {
    await assertOwner(businessId, clerkUserId);

    return prisma.booking.findMany({
      where: {
        businessId,
        status: { in: BLOCKING_STATUSES.concat(["COMPLETED"]) },
        startTime: { gte: weekStart },
        endTime: { lte: weekEnd },
      },
      include: { service: true },
      orderBy: { startTime: "asc" },
    });
  },
};
