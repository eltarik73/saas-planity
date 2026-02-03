import { auth } from "@clerk/nextjs/server";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  withErrorHandler,
} from "@/lib/api-utils";
import { businessCreateSchema, businessUpdateSchema } from "@/lib/validations";
import { BusinessService } from "@/services/business.service";

/** GET — Récupérer le garage du user connecté */
export const GET = withErrorHandler(async () => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  return apiSuccess(business);
});

/** POST — Créer un garage (onboarding) */
export const POST = withErrorHandler(async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  // Vérifier que le user n'a pas déjà un garage
  const existing = await BusinessService.getByOwner(userId);
  if (existing) return apiError("Vous avez déjà un garage", 400);

  const body = await req.json();
  const input = businessCreateSchema.parse(body);
  const business = await BusinessService.create(input, userId);
  return apiSuccess(business, 201);
});

/** PATCH — Mettre à jour le garage */
export const PATCH = withErrorHandler(async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const body = await req.json();
  const input = businessUpdateSchema.parse(body);
  const updated = await BusinessService.update(business.id, input, userId);
  return apiSuccess(updated);
});
