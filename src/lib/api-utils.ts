import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ─── Standard API Responses ─────────────────

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiConflict(message = "Créneau déjà réservé") {
  return apiError(message, 409);
}

export function apiUnauthorized(message = "Non autorisé") {
  return apiError(message, 401);
}

export function apiForbidden(message = "Accès interdit") {
  return apiError(message, 403);
}

export function apiNotFound(message = "Ressource introuvable") {
  return apiError(message, 404);
}

// ─── Error Handler Wrapper ──────────────────

type ApiHandler = (
  req: Request,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join(", ");
        return apiError(`Validation : ${messages}`, 422);
      }

      // Service errors with status code
      if (error instanceof Error && "status" in error) {
        const status = (error as Error & { status: number }).status;
        return apiError(error.message, status);
      }

      if (error instanceof AuthError) {
        return apiUnauthorized();
      }

      console.error("[API Error]", error);

      // Sentry capture will be added in Bloc 4
      return apiError("Erreur interne du serveur", 500);
    }
  };
}

// ─── Auth Helper ────────────────────────────

export function requireAuth(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new AuthError();
  }
}

export class AuthError extends Error {
  constructor() {
    super("Non autorisé");
    this.name = "AuthError";
  }
}
