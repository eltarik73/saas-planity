import { auth } from "@clerk/nextjs/server";
import { apiSuccess, apiUnauthorized, apiNotFound, withErrorHandler } from "@/lib/api-utils";
import { serviceUpdateSchema } from "@/lib/validations";
import { ServiceService } from "@/services/service.service";

/** PATCH — Modifier une prestation */
export const PATCH = withErrorHandler(
  async (req: Request, context?: { params: Record<string, string> }) => {
    const { userId } = await auth();
    if (!userId) return apiUnauthorized();

    const id = context?.params?.id;
    if (!id) return apiNotFound();

    const body = await req.json();
    const input = serviceUpdateSchema.parse(body);
    const service = await ServiceService.update(id, input, userId);
    return apiSuccess(service);
  }
);

/** DELETE — Désactiver une prestation (soft delete) */
export const DELETE = withErrorHandler(
  async (_req: Request, context?: { params: Record<string, string> }) => {
    const { userId } = await auth();
    if (!userId) return apiUnauthorized();

    const id = context?.params?.id;
    if (!id) return apiNotFound();

    await ServiceService.deactivate(id, userId);
    return apiSuccess({ deleted: true });
  }
);
