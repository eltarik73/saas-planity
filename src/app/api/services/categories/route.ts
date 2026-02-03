import { apiSuccess, withErrorHandler } from "@/lib/api-utils";
import { ServiceService } from "@/services/service.service";

export const GET = withErrorHandler(async () => {
  const categories = await ServiceService.listCategories();
  return apiSuccess(categories);
});
