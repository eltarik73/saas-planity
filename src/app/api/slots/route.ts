import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/api-utils";
import { SlotService } from "@/services/slot.service";

const querySchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  days: z.coerce.number().int().min(1).max(14).optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = querySchema.parse({
    businessId: searchParams.get("businessId"),
    serviceId: searchParams.get("serviceId"),
    date: searchParams.get("date"),
    days: searchParams.get("days") ?? undefined,
  });

  if (params.days && params.days > 1) {
    const result = await SlotService.getSlotsForRange(
      params.businessId,
      params.serviceId,
      params.date,
      params.days
    );
    return apiSuccess(result);
  }

  const slots = await SlotService.getAvailableSlots(
    params.businessId,
    params.serviceId,
    params.date
  );
  return apiSuccess(slots);
});
