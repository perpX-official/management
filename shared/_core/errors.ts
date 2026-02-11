export type AppError = Error & { code?: string; status?: number };

export function ForbiddenError(message: string = "Forbidden"): AppError {
  const error = new Error(message) as AppError;
  error.code = "FORBIDDEN";
  error.status = 403;
  return error;
}
