import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiUnauthorized, apiNotFound, withErrorHandler } from "@/lib/api-utils";
import { bookingStatusUpdateSchema } from "@/lib/validations";
import { BookingService } from "@/services/booking.service";

/** PATCH — Modifier statut / note interne d'une réservation */
export const PATCH = withErrorHandler(
  async (req: Request, context?: { params: Record<string, string> }) => {
    const { userId } = await auth();
    if (!userId) return apiUnauthorized();

    const id = context?.params?.id;
    if (!id) return apiNotFound();

    const body = await req.json();
    const { status, internalNote } = bookingStatusUpdateSchema.parse(body);

    const booking = await BookingService.updateStatus(
      id,
      status,
      internalNote,
      userId
    );
    return apiSuccess(booking);
  }
);
