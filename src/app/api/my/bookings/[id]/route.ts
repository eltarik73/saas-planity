import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiUnauthorized, apiNotFound, withErrorHandler } from "@/lib/api-utils";
import { BookingService } from "@/services/booking.service";
import { EmailService } from "@/services/email.service";

/** POST — Annuler ma réservation */
export const POST = withErrorHandler(
  async (_req: Request, context?: { params: Record<string, string> }) => {
    const { userId } = await auth();
    if (!userId) return apiUnauthorized();

    const id = context?.params?.id;
    if (!id) return apiNotFound();

    const booking = await BookingService.cancel(id, userId);

    // Email d'annulation (non-bloquant)
    EmailService.sendBookingCancellation({
      booking,
      business: booking.business,
      service: booking.service,
    }).catch(console.error);

    return apiSuccess({ cancelled: true });
  }
);
