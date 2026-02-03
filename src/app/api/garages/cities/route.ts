import { apiSuccess, withErrorHandler } from "@/lib/api-utils";
import { BusinessService } from "@/services/business.service";

export const GET = withErrorHandler(async () => {
  const cities = await BusinessService.listCities();
  return apiSuccess(cities);
});
