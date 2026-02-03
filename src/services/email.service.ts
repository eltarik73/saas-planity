import { formatDateTimeFr, formatPrice, formatDuration } from "@/lib/date-utils";
import type { Booking, Business, Service } from "@prisma/client";

// ─── Types ──────────────────────────────────

interface BookingEmailData {
  booking: Booking;
  business: Business;
  service: Service;
}

interface BrevoPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
}

// ─── Brevo API Call ─────────────────────────

async function sendBrevoEmail(payload: BrevoPayload): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[Email] BREVO_API_KEY non configurée, email ignoré");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email] Brevo error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

// ─── Sender ─────────────────────────────────

function getSender() {
  return {
    name: process.env.BREVO_SENDER_NAME ?? "GaragistePro",
    email: process.env.BREVO_SENDER_EMAIL ?? "noreply@garagistepro.fr",
  };
}

// ─── Templates ──────────────────────────────

function bookingConfirmationHtml(data: BookingEmailData): string {
  const { booking, business, service } = data;
  const tz = business.timezone || "Europe/Paris";
  const dateTime = formatDateTimeFr(booking.startTime, tz);
  const price = formatPrice(booking.priceCents);
  const duration = formatDuration(service.durationMin);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Réservation confirmée ✓</h1>
      <p>Bonjour ${booking.clientName},</p>
      <p>Votre réservation chez <strong>${business.name}</strong> est confirmée.</p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>Prestation :</strong> ${service.name}</p>
        <p><strong>Date :</strong> ${dateTime}</p>
        <p><strong>Durée :</strong> ${duration}</p>
        <p><strong>Prix :</strong> ${price}</p>
        <p><strong>Véhicule :</strong> ${booking.licensePlate}${
    booking.vehicleBrand ? ` — ${booking.vehicleBrand}` : ""
  }${booking.vehicleModel ? ` ${booking.vehicleModel}` : ""}</p>
        <p><strong>Adresse :</strong> ${business.address}, ${business.postalCode} ${business.city}</p>
      </div>

      ${booking.clientNote ? `<p><em>Votre message : ${booking.clientNote}</em></p>` : ""}
      
      <p>À bientôt !<br>L'équipe GaragistePro</p>
    </div>
  `;
}

function bookingCancellationHtml(data: BookingEmailData): string {
  const { booking, business, service } = data;
  const tz = business.timezone || "Europe/Paris";
  const dateTime = formatDateTimeFr(booking.startTime, tz);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">Réservation annulée</h1>
      <p>Bonjour ${booking.clientName},</p>
      <p>Votre réservation chez <strong>${business.name}</strong> a été annulée.</p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>Prestation :</strong> ${service.name}</p>
        <p><strong>Date prévue :</strong> ${dateTime}</p>
      </div>
      
      <p>N'hésitez pas à réserver un nouveau créneau sur GaragistePro.</p>
      <p>L'équipe GaragistePro</p>
    </div>
  `;
}

function garageNotificationHtml(data: BookingEmailData): string {
  const { booking, business, service } = data;
  const tz = business.timezone || "Europe/Paris";
  const dateTime = formatDateTimeFr(booking.startTime, tz);
  const price = formatPrice(booking.priceCents);
  const duration = formatDuration(service.durationMin);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Nouvelle réservation 🔔</h1>
      <p>Une nouvelle réservation vient d'arriver !</p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>Client :</strong> ${booking.clientName} (${booking.clientEmail})</p>
        ${booking.clientPhone ? `<p><strong>Tél :</strong> ${booking.clientPhone}</p>` : ""}
        <p><strong>Prestation :</strong> ${service.name}</p>
        <p><strong>Date :</strong> ${dateTime}</p>
        <p><strong>Durée :</strong> ${duration}</p>
        <p><strong>Prix :</strong> ${price}</p>
        <p><strong>Véhicule :</strong> ${booking.licensePlate}${
    booking.vehicleBrand ? ` — ${booking.vehicleBrand}` : ""
  }${booking.vehicleModel ? ` ${booking.vehicleModel}` : ""}</p>
        ${booking.mileage ? `<p><strong>Kilométrage :</strong> ${booking.mileage.toLocaleString("fr-FR")} km</p>` : ""}
      </div>

      ${booking.clientNote ? `<p><strong>Message client :</strong> ${booking.clientNote}</p>` : ""}
      
      <p>Connectez-vous à votre dashboard pour gérer cette réservation.</p>
    </div>
  `;
}

// ─── Service ────────────────────────────────

export const EmailService = {
  /** Email de confirmation au client */
  async sendBookingConfirmation(data: BookingEmailData) {
    return sendBrevoEmail({
      sender: getSender(),
      to: [{ email: data.booking.clientEmail, name: data.booking.clientName }],
      subject: `Réservation confirmée — ${data.service.name} chez ${data.business.name}`,
      htmlContent: bookingConfirmationHtml(data),
    });
  },

  /** Email d'annulation au client */
  async sendBookingCancellation(data: BookingEmailData) {
    return sendBrevoEmail({
      sender: getSender(),
      to: [{ email: data.booking.clientEmail, name: data.booking.clientName }],
      subject: `Réservation annulée — ${data.business.name}`,
      htmlContent: bookingCancellationHtml(data),
    });
  },

  /** Notification au garagiste */
  async sendGarageNotification(data: BookingEmailData) {
    if (!data.business.email) return false;

    return sendBrevoEmail({
      sender: getSender(),
      to: [{ email: data.business.email, name: data.business.name }],
      subject: `Nouvelle réservation — ${data.booking.clientName}`,
      htmlContent: garageNotificationHtml(data),
    });
  },

  /** Rappel J-1 (appelé par un cron ou webhook) */
  async sendBookingReminder(data: BookingEmailData) {
    const tz = data.business.timezone || "Europe/Paris";
    const dateTime = formatDateTimeFr(data.booking.startTime, tz);

    return sendBrevoEmail({
      sender: getSender(),
      to: [
        { email: data.booking.clientEmail, name: data.booking.clientName },
      ],
      subject: `Rappel : votre RDV demain chez ${data.business.name}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Rappel de votre rendez-vous</h1>
          <p>Bonjour ${data.booking.clientName},</p>
          <p>Pour rappel, vous avez RDV <strong>demain à ${dateTime}</strong> 
             chez <strong>${data.business.name}</strong> pour 
             <strong>${data.service.name}</strong>.</p>
          <p><strong>Adresse :</strong> ${data.business.address}, ${data.business.postalCode} ${data.business.city}</p>
          <p>À demain !<br>L'équipe GaragistePro</p>
        </div>
      `,
    });
  },
};
