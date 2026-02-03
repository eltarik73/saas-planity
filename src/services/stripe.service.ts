import Stripe from "stripe";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { Business, Booking } from "@prisma/client";

// ─── Stripe Client ──────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante");
  return new Stripe(key, { apiVersion: "2024-10-28.acacia" });
}

// ─── Types ──────────────────────────────────

interface CreatePaymentParams {
  booking: Booking;
  business: Business;
}

interface PaymentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
}

// ─── Service ────────────────────────────────

export const StripeService = {
  /**
   * Crée un PaymentIntent pour une réservation.
   * Le montant dépend du paymentMode du garage.
   */
  async createPaymentIntent({
    booking,
    business,
  }: CreatePaymentParams): Promise<PaymentResult> {
    if (!isFeatureEnabled("paymentsEnabled")) {
      throw new Error("Les paiements ne sont pas activés");
    }

    if (!business.onlinePaymentEnabled || business.paymentMode === "NONE") {
      throw new Error("Ce garage n'accepte pas les paiements en ligne");
    }

    const stripe = getStripe();

    // Calcul montant
    let amountCents: number;

    if (business.paymentMode === "FULL") {
      amountCents = booking.priceCents;
    } else {
      // DEPOSIT
      if (business.depositAmountCents) {
        amountCents = business.depositAmountCents;
      } else if (business.depositPercent) {
        amountCents = Math.round(
          (booking.priceCents * business.depositPercent) / 100
        );
      } else {
        throw new Error("Configuration dépôt incomplète");
      }
    }

    // Créer PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      metadata: {
        bookingId: booking.id,
        businessId: business.id,
        serviceId: booking.serviceId,
      },
      // Si le garage a un compte Connect
      ...(business.stripeAccountId && {
        transfer_data: {
          destination: business.stripeAccountId,
        },
      }),
      description: `Réservation ${booking.id} — ${business.name}`,
      receipt_email: booking.clientEmail,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amountCents,
    };
  },

  /**
   * Traite un événement webhook Stripe.
   * Retourne le bookingId impacté.
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<{
    bookingId: string | null;
    action: string;
  }> {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata.bookingId ?? null;
        return { bookingId, action: "payment_succeeded" };
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata.bookingId ?? null;
        return { bookingId, action: "payment_failed" };
      }

      default:
        return { bookingId: null, action: "ignored" };
    }
  },

  /**
   * Rembourse un PaymentIntent.
   */
  async refund(paymentIntentId: string): Promise<Stripe.Refund> {
    const stripe = getStripe();
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  },

  /**
   * Vérifie la signature d'un webhook.
   */
  constructEvent(
    body: string | Buffer,
    signature: string
  ): Stripe.Event {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET manquante");

    return stripe.webhooks.constructEvent(body, signature, secret);
  },
};
