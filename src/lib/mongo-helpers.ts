import mongoose, { ClientSession } from "mongoose";

function isTransactionUnsupportedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? (err as { code?: number }).code : undefined;
  const msg = "message" in err ? String((err as { message?: string }).message) : "";
  return (
    code === 20 ||
    msg.includes("Transaction numbers are only allowed on a replica set member") ||
    msg.includes("ReplicaSet") ||
    msg.includes("does not support retryable writes") ||
    msg.includes("Sessions are not supported")
  );
}

/**
 * Chạy thao tác trong MongoDB transaction nếu server hỗ trợ Replica Set / Atlas,
 * tự động fallback an toàn cho MongoDB local standalone (không làm gãy runtime).
 */
export async function runWithOptionalTransaction<T>(
  work: (session: ClientSession | null) => Promise<T>,
  rollbackOnStandaloneError?: () => Promise<void>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTransactionUnsupportedError(err)) {
      try {
        return await work(null);
      } catch (innerErr) {
        if (rollbackOnStandaloneError) {
          await rollbackOnStandaloneError().catch(() => {});
        }
        throw innerErr;
      }
    }
    throw err;
  } finally {
    await session.endSession().catch(() => {});
  }
}

