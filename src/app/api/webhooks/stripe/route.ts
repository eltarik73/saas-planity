import { NextRequest, NextResponse } from "next/server";
import { StripeService } from "@/services/stripe.service";
import { BookingService } from "@/services/booking.service";
import { EmailService } from "@/services/email.service";

// Stripe envoie du raw body, pas du JSON parsé
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = StripeService.constructEvent(body, signature);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const { bookingId, action } = await StripeService.handleWebhookEvent(event);

    if (bookingId) {
      if (action === "payment_succeeded") {
        const booking = await BookingService.updatePayment(bookingId, {
          paymentStatus: "PAID",
        });

        // Confirmer automatiquement le booking
        const full = await BookingService.getById(bookingId);
        if (full && full.status === "PENDING") {
          await BookingService.updatePayment(bookingId, {
            paymentStatus: "PAID",
          });
        }
      }

      if (action === "payment_failed") {
        await BookingService.updatePayment(bookingId, {
          paymentStatus: "FAILED",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
