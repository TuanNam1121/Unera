import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import {
  IUserActivityGeo,
  UserActivityActorRole,
  UserActivityCategory,
  UserActivityLog,
  UserActivitySeverity,
  UserActivityStatus,
} from "@/models/UserActivityLog";

const SENSITIVE_KEY_PATTERN =
  /(password|pass|token|secret|cookie|authorization|credential|apikey|api_key)/i;
const MAX_STRING_LENGTH = 500;
const MAX_USER_AGENT_LENGTH = 512;

export interface ClientRequestContext {
  ipAddress: string;
  geo?: IUserActivityGeo;
  userAgent?: string;
  deviceSummary?: string;
  requestPath: string;
  httpMethod: string;
}

export interface LogUserActivityParams {
  req?: Request;
  actorId?: string | mongoose.Types.ObjectId | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: UserActivityActorRole;
  category: UserActivityCategory;
  action: string;
  description: string;
  status?: UserActivityStatus;
  severity?: UserActivitySeverity;
  statusCode?: number;
  errorMessage?: string;
  requestPath?: string;
  httpMethod?: string;
  targetCollection?: string;
  targetId?: string | mongoose.Types.ObjectId | null;
  targetTitle?: string;
  metadata?: Record<string, unknown>;
}

function normalizeIp(rawIp: string): string {
  const trimmed = rawIp.trim();
  if (!trimmed) return "unknown";
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }
  return trimmed;
}

function decodeHeaderSafely(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Produces a concise browser + OS label from the User-Agent header for table scanning.
 */
export function parseDeviceSummary(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();

  let browser = "Trình duyệt khác";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";
  else if (ua.includes("curl/") || ua.includes("postman") || ua.includes("insomnia")) {
    browser = "API Client";
  }

  let os = "Thiết bị";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} · ${os}`;
}

/**
 * Extracts normalized client IP, Vercel geo headers, device summary, and request path.
 */
export function extractClientContext(req?: Request): ClientRequestContext {
  if (!req) {
    return {
      ipAddress: "unknown",
      requestPath: "internal",
      httpMethod: "SYSTEM",
    };
  }

  const vercelForwarded = req.headers.get("x-vercel-forwarded-for")?.split(",")[0];
  const rawIp = vercelForwarded?.trim() || getClientIp(req);
  const ipAddress = normalizeIp(rawIp);

  const country = decodeHeaderSafely(req.headers.get("x-vercel-ip-country"));
  const city = decodeHeaderSafely(req.headers.get("x-vercel-ip-city"));
  const geo =
    country || city
      ? {
          ...(country ? { country } : {}),
          ...(city ? { city } : {}),
        }
      : undefined;

  const rawUa = req.headers.get("user-agent")?.trim();
  const userAgent = rawUa ? rawUa.slice(0, MAX_USER_AGENT_LENGTH) : undefined;
  const deviceSummary = parseDeviceSummary(userAgent);

  let requestPath = "/";
  try {
    requestPath = new URL(req.url).pathname || "/";
  } catch {
    requestPath = req.url || "/";
  }

  return {
    ipAddress,
    geo,
    userAgent,
    deviceSummary,
    requestPath,
    httpMethod: (req.method || "GET").toUpperCase(),
  };
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[Truncated]";

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}...`
      : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        cleanObj[key] = "[REDACTED]";
      } else {
        cleanObj[key] = sanitizeValue(val, depth + 1);
      }
    }
    return cleanObj;
  }

  return String(value);
}

/**
 * Recursively strips sensitive credentials/tokens and bounds string lengths in metadata.
 */
export function sanitizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;
  return sanitizeValue(metadata, 0) as Record<string, unknown>;
}

/**
 * Records a user or anonymous client activity event to `user_activity_logs`.
 * Designed to never throw so audit logging failures cannot break user requests.
 */
export async function logUserActivity(
  params: LogUserActivityParams
): Promise<void> {
  try {
    await connectToDatabase();

    const ctx = extractClientContext(params.req);
    const status: UserActivityStatus = params.status ?? "SUCCESS";
    const severity: UserActivitySeverity =
      params.severity ??
      (status === "BLOCKED" ? "HIGH" : status === "FAILED" ? "WARN" : "INFO");

    const normalizedActorId =
      params.actorId && mongoose.Types.ObjectId.isValid(String(params.actorId))
        ? new mongoose.Types.ObjectId(String(params.actorId))
        : null;

    await UserActivityLog.create({
      actorId: normalizedActorId,
      actorEmail: params.actorEmail?.trim().toLowerCase() || undefined,
      actorName: params.actorName?.trim() || undefined,
      actorRole: params.actorRole ?? (normalizedActorId ? "STUDENT" : "GUEST"),
      category: params.category,
      action: params.action,
      description: params.description,
      status,
      severity,
      statusCode: params.statusCode,
      errorMessage: params.errorMessage?.slice(0, MAX_STRING_LENGTH),
      ipAddress: ctx.ipAddress,
      geo: ctx.geo,
      userAgent: ctx.userAgent,
      deviceSummary: ctx.deviceSummary,
      requestPath: params.requestPath || ctx.requestPath,
      httpMethod: (params.httpMethod || ctx.httpMethod).toUpperCase(),
      targetCollection: params.targetCollection,
      targetId: params.targetId ? String(params.targetId) : undefined,
      targetTitle: params.targetTitle,
      metadata: sanitizeMetadata(params.metadata),
    });
  } catch (error) {
    console.error("[UserActivityLog] Failed to record user activity:", error);
  }
}

