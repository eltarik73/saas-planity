import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiError, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { businessHoursBulkSchema } from "@/lib/validations";
import { BusinessService } from "@/services/business.service";

/** PUT — Remplacer les horaires hebdo */
export const PUT = withErrorHandler(async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const body = await req.json();
  const hours = businessHoursBulkSchema.parse(body);
  await BusinessService.setHours(business.id, hours, userId);
  return apiSuccess({ updated: true });
});
