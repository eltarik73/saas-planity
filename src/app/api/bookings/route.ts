import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiError, apiConflict, withErrorHandler } from "@/lib/api-utils";
import { bookingCreateSchema } from "@/lib/validations";
import { BookingService, ConflictError } from "@/services/booking.service";
import { StripeService } from "@/services/stripe.service";
import { EmailService } from "@/services/email.service";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const input = bookingCreateSchema.parse(body);

  // Utilisateur connecté (optionnel pour booking)
  const { userId } = await auth();

  try {
    // 1) Créer booking (transaction SERIALIZABLE)
    const booking = await BookingService.create(input, userId ?? undefined);

    // 2) Si paiement requis → créer PaymentIntent
    let paymentData = null;
    if (
      booking.paymentStatus === "PENDING" &&
      isFeatureEnabled("paymentsEnabled")
    ) {
      try {
        paymentData = await StripeService.createPaymentIntent({
          booking,
          business: booking.business,
        });

        // Sauvegarder paymentIntentId
        await BookingService.updatePayment(booking.id, {
          paymentIntentId: paymentData.paymentIntentId,
        });
      } catch (stripeErr) {
        console.error("[Booking] Stripe error:", stripeErr);
        // On laisse le booking en PENDING sans paiement
      }
    }

    // 3) Emails (non-bloquant)
    Promise.allSettled([
      EmailService.sendBookingConfirmation({
        booking,
        business: booking.business,
        service: booking.service,
      }),
      EmailService.sendGarageNotification({
        booking,
        business: booking.business,
        service: booking.service,
      }),
    ]).catch(console.error);

    return apiSuccess(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          startTime: booking.startTime,
          endTime: booking.endTime,
          priceCents: booking.priceCents,
          paymentStatus: booking.paymentStatus,
        },
        payment: paymentData
          ? {
              clientSecret: paymentData.clientSecret,
              amountCents: paymentData.amountCents,
            }
          : null,
      },
      201
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return apiConflict(error.message);
    }
    throw error;
  }
});
