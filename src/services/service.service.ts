import { prisma } from "@/lib/prisma";
import { assertOwner } from "./business.service";
import type { ServiceCreateInput, ServiceUpdateInput } from "@/lib/validations";

export const ServiceService = {
  /** Créer une prestation */
  async create(
    businessId: string,
    input: ServiceCreateInput,
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);

    return prisma.service.create({
      data: { ...input, businessId },
    });
  },

  /** Modifier une prestation */
  async update(
    serviceId: string,
    input: ServiceUpdateInput,
    clerkUserId: string
  ) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { businessId: true },
    });
    if (!service) throw new Error("Prestation introuvable");

    await assertOwner(service.businessId, clerkUserId);

    return prisma.service.update({
      where: { id: serviceId },
      data: input,
    });
  },

  /** Supprimer (soft delete: isActive = false) */
  async deactivate(serviceId: string, clerkUserId: string) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { businessId: true },
    });
    if (!service) throw new Error("Prestation introuvable");

    await assertOwner(service.businessId, clerkUserId);

    return prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  },

  /** Liste prestations d'un garage (public) */
  async listByBusiness(businessId: string) {
    return prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  },

  /** Liste prestations d'un garage (dashboard — inclut inactives) */
  async listByBusinessAll(businessId: string, clerkUserId: string) {
    await assertOwner(businessId, clerkUserId);

    return prisma.service.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
    });
  },

  /** Récupérer par ID */
  async getById(serviceId: string) {
    return prisma.service.findUnique({ where: { id: serviceId } });
  },

  /** Réordonner prestations */
  async reorder(
    businessId: string,
    orderedIds: string[],
    clerkUserId: string
  ) {
    await assertOwner(businessId, clerkUserId);

    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.service.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  },

  /** Lister les catégories distinctes (public, pour filtres) */
  async listCategories() {
    const results = await prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return results.map((r) => r.category);
  },
};
