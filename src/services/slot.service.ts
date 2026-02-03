import { prisma } from "@/lib/prisma";
import { addMinutes, addDays, startOfDay, isBefore, isAfter } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  SLOT_STEP_MINUTES,
  getDayOfWeek,
  parseTime,
  formatTimeLocal,
  formatDateLocal,
  type TimeSlot,
  type BookingRange,
} from "@/lib/date-utils";
import type { BookingStatus } from "@prisma/client";

// Statuts qui bloquent un créneau
const BLOCKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
];

export const SlotService = {
  /**
   * Créneaux disponibles pour un jour donné.
   *
   * @param businessId  - ID garage
   * @param serviceId   - ID prestation (pour la durée)
   * @param dateStr      - "YYYY-MM-DD" dans la timezone business
   */
  async getAvailableSlots(
    businessId: string,
    serviceId: string,
    dateStr: string
  ): Promise<TimeSlot[]> {
    // 1) Charger business + service + horaires
    const [business, service] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: { businessHours: true, hoursExceptions: true },
      }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!business || !service) return [];
    if (!business.isActive || !service.isActive) return [];

    const tz = business.timezone || "Europe/Paris";
    const durationMin = service.durationMin;

    // 2) Date de début/fin du jour en UTC
    const dayLocal = new Date(`${dateStr}T00:00:00`);
    const dayStartUtc = fromZonedTime(startOfDay(dayLocal), tz);
    const dayEndUtc = fromZonedTime(
      startOfDay(addDays(dayLocal, 1)),
      tz
    );

    // 3) Vérifier exception pour ce jour
    const exception = business.hoursExceptions.find((e) => {
      const excDate = formatDateLocal(e.date, tz);
      return excDate === dateStr;
    });

    let openTime: string;
    let closeTime: string;

    if (exception) {
      if (exception.isClosed) return [];
      if (!exception.openTime || !exception.closeTime) return [];
      openTime = exception.openTime;
      closeTime = exception.closeTime;
    } else {
      // Horaires hebdo
      const dayOfWeek = getDayOfWeek(dayStartUtc, tz);
      const hours = business.businessHours.find(
        (h) => h.dayOfWeek === dayOfWeek
      );
      if (!hours || hours.isClosed) return [];
      openTime = hours.openTime;
      closeTime = hours.closeTime;
    }

    // 4) Construire les bornes UTC ouverture/fermeture
    const { hours: oh, minutes: om } = parseTime(openTime);
    const { hours: ch, minutes: cm } = parseTime(closeTime);

    const openZoned = new Date(dayLocal);
    openZoned.setHours(oh, om, 0, 0);
    const closeZoned = new Date(dayLocal);
    closeZoned.setHours(ch, cm, 0, 0);

    const openUtc = fromZonedTime(openZoned, tz);
    const closeUtc = fromZonedTime(closeZoned, tz);

    // 5) Charger bookings existants pour ce jour
    const existingBookings: BookingRange[] = await prisma.booking.findMany({
      where: {
        businessId,
        status: { in: BLOCKING_STATUSES },
        startTime: { lt: dayEndUtc },
        endTime: { gt: dayStartUtc },
      },
      select: { startTime: true, endTime: true },
    });

    // 6) Générer créneaux par pas de 30 min
    const slots: TimeSlot[] = [];
    let cursor = new Date(openUtc);
    const now = new Date();

    while (true) {
      const slotEnd = addMinutes(cursor, durationMin);

      // Le créneau ne doit pas dépasser la fermeture
      if (isAfter(slotEnd, closeUtc)) break;

      // Pas de créneau dans le passé
      if (isAfter(cursor, now) || cursor.getTime() === now.getTime()) {
        // Vérifier overlap avec bookings existants
        const overlaps = existingBookings.some(
          (b) =>
            isBefore(cursor, b.endTime) && isAfter(slotEnd, b.startTime)
        );

        if (!overlaps) {
          slots.push({
            start: new Date(cursor),
            end: new Date(slotEnd),
            startLocal: formatTimeLocal(cursor, tz),
          });
        }
      }

      cursor = addMinutes(cursor, SLOT_STEP_MINUTES);
    }

    return slots;
  },

  /**
   * Créneaux pour plusieurs jours (vue semaine / sélection).
   */
  async getSlotsForRange(
    businessId: string,
    serviceId: string,
    startDate: string,
    days: number = 7
  ) {
    const results: {
      date: string;
      dayLabel: string;
      slots: TimeSlot[];
    }[] = [];

    const start = new Date(`${startDate}T00:00:00`);

    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const dateStr = day.toISOString().split("T")[0];
      const dayLabel = day.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });

      const slots = await this.getAvailableSlots(
        businessId,
        serviceId,
        dateStr
      );

      results.push({ date: dateStr, dayLabel, slots });
    }

    return results;
  },

  /**
   * Vérifie qu'un créneau spécifique est encore libre.
   * Utilisé juste avant la création du booking (double-check).
   */
  async isSlotAvailable(
    businessId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const conflicting = await prisma.booking.findFirst({
      where: {
        businessId,
        status: { in: BLOCKING_STATUSES },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    return conflicting === null;
  },
};
