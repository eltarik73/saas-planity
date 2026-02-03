import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiError, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { serviceCreateSchema } from "@/lib/validations";
import { BusinessService } from "@/services/business.service";
import { ServiceService } from "@/services/service.service";

/** GET — Lister toutes les prestations (inclut inactives) */
export const GET = withErrorHandler(async () => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const services = await ServiceService.listByBusinessAll(business.id, userId);
  return apiSuccess(services);
});

/** POST — Créer une prestation */
export const POST = withErrorHandler(async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const body = await req.json();
  const input = serviceCreateSchema.parse(body);
  const service = await ServiceService.create(business.id, input, userId);
  return apiSuccess(service, 201);
});
