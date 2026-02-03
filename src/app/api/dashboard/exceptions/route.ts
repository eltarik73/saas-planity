import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiError, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { hoursExceptionSchema } from "@/lib/validations";
import { BusinessService } from "@/services/business.service";

/** POST — Ajouter/modifier une exception horaire */
export const POST = withErrorHandler(async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const body = await req.json();
  const input = hoursExceptionSchema.parse(body);
  const exception = await BusinessService.upsertException(
    business.id,
    input,
    userId
  );
  return apiSuccess(exception, 201);
});
