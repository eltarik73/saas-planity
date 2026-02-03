import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiUnauthorized, apiNotFound, withErrorHandler } from "@/lib/api-utils";
import { BusinessService } from "@/services/business.service";

/** DELETE — Supprimer une exception horaire */
export const DELETE = withErrorHandler(
  async (_req: Request, context?: { params: Record<string, string> }) => {
    const { userId } = await auth();
    if (!userId) return apiUnauthorized();

    const id = context?.params?.id;
    if (!id) return apiNotFound();

    const business = await BusinessService.getByOwner(userId);
    if (!business) return apiNotFound("Garage introuvable");

    await BusinessService.deleteException(business.id, id, userId);
    return apiSuccess({ deleted: true });
  }
);
