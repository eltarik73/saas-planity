import { prisma } from "@/lib/prisma";
import type { Prisma, DayOfWeek } from "@prisma/client";
import type {
  BusinessCreateInput,
  BusinessUpdateInput,
  BusinessHoursInput,
  HoursExceptionInput,
  GarageSearchInput,
} from "@/lib/validations";

// ─── Error Classes ──────────────────────────

export class NotFoundError extends Error {
  status = 404;
  constructor(msg = "Ressource introuvable") {
    super(msg);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(msg = "Accès interdit") {
    super(msg);
    this.name = "ForbiddenError";
  }
}

// ─── RBAC Helper ────────────────────────────

export async function assertOwner(businessId: string, clerkUserId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, clerkUserId: true },
  });
  if (!business) throw new NotFoundError("Garage introuvable");
  if (business.clerkUserId !== clerkUserId) throw new ForbiddenError();
  return business;
}

// ─── Service ────────────────────────────────

export const BusinessService = {
  /** Création garage (onboarding) */
  async create(input: BusinessCreateInput, clerkUserId: string) {
    const existing = await prisma.business.findUnique({
      where: { slug: input.slug },
    });
    if (existing) throw new Error("Ce slug est déjà utilisé");

    return prisma.business.create({
      data: { ...input, clerkUserId },
    });
  },

  /** Mise à jour garage */
  async update(
    businessId: string,
    input: BusinessUpdateInput,
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);

    if (input.slug) {
      const existing = await prisma.business.findUnique({
        where: { slug: input.slug },
      });
      if (existing && existing.id !== businessId) {
        throw new Error("Ce slug est déjà utilisé");
      }
    }

    return prisma.business.update({
      where: { id: businessId },
      data: input,
    });
  },

  /** Garage du propriétaire connecté */
  async getByOwner(clerkUserId: string) {
    return prisma.business.findFirst({
      where: { clerkUserId },
      include: {
        services: { orderBy: { sortOrder: "asc" } },
        businessHours: { orderBy: { dayOfWeek: "asc" } },
        hoursExceptions: { orderBy: { date: "asc" } },
      },
    });
  },

  /** Page publique garage par slug */
  async getBySlug(slug: string) {
    return prisma.business.findUnique({
      where: { slug, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        businessHours: true,
      },
    });
  },

  /** Récupérer avec toutes relations (interne) */
  async getById(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        businessHours: true,
        hoursExceptions: true,
      },
    });
  },

  /** Recherche publique garages avec pagination */
  async search(filters: GarageSearchInput) {
    const where: Prisma.BusinessWhereInput = { isActive: true };

    if (filters.city) {
      where.city = { equals: filters.city, mode: "insensitive" };
    }
    if (filters.service) {
      where.services = {
        some: {
          category: { contains: filters.service, mode: "insensitive" },
          isActive: true,
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          services: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { name: "asc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.business.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  },

  /** Liste des villes distinctes (SSG/SEO) */
  async listCities() {
    const results = await prisma.business.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return results.map((r) => r.city);
  },

  /** Remplacement horaires hebdo (bulk upsert atomique) */
  async setHours(
    businessId: string,
    hours: BusinessHoursInput[],
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);

    return prisma.$transaction(async (tx) => {
      await tx.businessHours.deleteMany({ where: { businessId } });
      return tx.businessHours.createMany({
        data: hours.map((h) => ({
          businessId,
          dayOfWeek: h.dayOfWeek as DayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      });
    });
  },

  /** Ajout/maj exception horaire */
  async upsertException(
    businessId: string,
    input: HoursExceptionInput,
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);

    return prisma.businessHoursException.upsert({
      where: {
        businessId_date: {
          businessId,
          date: new Date(input.date),
        },
      },
      update: {
        openTime: input.openTime ?? null,
        closeTime: input.closeTime ?? null,
        isClosed: input.isClosed,
        reason: input.reason ?? null,
      },
      create: {
        businessId,
        date: new Date(input.date),
        openTime: input.openTime ?? null,
        closeTime: input.closeTime ?? null,
        isClosed: input.isClosed,
        reason: input.reason ?? null,
      },
    });
  },

  /** Suppression exception */
  async deleteException(
    businessId: string,
    exceptionId: string,
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);
    return prisma.businessHoursException.delete({
      where: { id: exceptionId, businessId },
    });
  },

  /** Mise à jour config paiement Stripe */
  async updatePaymentConfig(
    businessId: string,
    data: {
      stripeAccountId?: string;
      onlinePaymentEnabled?: boolean;
      paymentMode?: "NONE" | "DEPOSIT" | "FULL";
      depositAmountCents?: number | null;
      depositPercent?: number | null;
    },
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);
    return prisma.business.update({ where: { id: businessId }, data });
  },
};
