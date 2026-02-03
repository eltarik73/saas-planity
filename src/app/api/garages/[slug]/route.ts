import { apiSuccess, apiNotFound, withErrorHandler } from "@/lib/api-utils";
import { BusinessService } from "@/services/business.service";

export const GET = withErrorHandler(
  async (
    _req: Request,
    context?: { params: Record<string, string> }
  ) => {
    const slug = context?.params?.slug;
    if (!slug) return apiNotFound("Slug requis");

    const business = await BusinessService.getBySlug(slug);
    if (!business) return apiNotFound("Garage introuvable");

    return apiSuccess(business);
  }
);
