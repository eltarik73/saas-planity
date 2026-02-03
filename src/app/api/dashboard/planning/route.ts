import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { addDays, startOfWeek } from "date-fns";
import { apiSuccess, apiError, apiUnauthorized, withErrorHandler } from "@/lib/api-utils";
import { BusinessService } from "@/services/business.service";
import { BookingService } from "@/services/booking.service";

const querySchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** GET — Planning semaine du garage */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiUnauthorized();

  const business = await BusinessService.getByOwner(userId);
  if (!business) return apiError("Aucun garage trouvé", 404);

  const { searchParams } = new URL(req.url);
  const { weekStart } = querySchema.parse({
    weekStart: searchParams.get("weekStart") ?? undefined,
  });

  const start = weekStart
    ? new Date(`${weekStart}T00:00:00`)
    : startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = addDays(start, 7);

  const bookings = await BookingService.getWeekPlanning(
    business.id,
    userId,
    start,
    end
  );
  return apiSuccess(bookings);
});
