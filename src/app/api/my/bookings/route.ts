import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { BookingService } from "@/services/booking.service";

/** GET — Réservations du client connecté */
export const GET = withErrorHandler(async () => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const bookings = await BookingService.getByUser(userId);
  return apiSuccess(bookings);
});
