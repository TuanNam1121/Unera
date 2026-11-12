/**
 * Only expose raw internal error details outside production to avoid leaking
 * database or stack information to clients.
 */
export function getDevErrorDetails(error: unknown): { details?: string } {
  if (process.env.NODE_ENV === "production") {
    return {};
  }
  const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  return { details: message };
}

