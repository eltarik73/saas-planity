import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/api-utils";
import { VehicleService } from "@/services/vehicle.service";

const querySchema = z.object({
  plate: z.string().min(1, "Plaque requise"),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { plate } = querySchema.parse({
    plate: searchParams.get("plate"),
  });

  const vehicle = await VehicleService.lookupByPlate(plate);

  if (!vehicle) {
    return apiSuccess({ found: false, vehicle: null });
  }

  return apiSuccess({ found: true, vehicle });
});
