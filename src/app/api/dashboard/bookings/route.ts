import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiError, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { BusinessService } from "@/services/business.service";
import { BookingService } from "@/services/booking.service";

/** GET — Liste des réservations du garage */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const { searchParams } = new URL(req.url);

  const filters = {
    status: searchParams.get("status") as any,
    from: searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : undefined,
    to: searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : undefined,
    page: searchParams.get("page")
      ? Number(searchParams.get("page"))
      : 1,
    limit: searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 50,
  };

  const result = await BookingService.getByBusiness(
    business.id,
    userId,
    filters
  );
  return apiSuccess(result);
});
