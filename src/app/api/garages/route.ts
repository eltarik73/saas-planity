import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandler } from "@/lib/api-utils";
import { garageSearchSchema } from "@/lib/validations";
import { BusinessService } from "@/services/business.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const filters = garageSearchSchema.parse({
    city: searchParams.get("city") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  const result = await BusinessService.search(filters);
  return apiSuccess(result);
});
