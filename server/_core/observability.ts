import crypto from "node:crypto";
import type { Request, Response } from "express";

const TRACKING_ID_HEADER = "x-perpx-tracking-id";

export type AuditOutcome = "success" | "error" | "blocked" | "warn";

type AuditEntry = {
  trackingId: string;
  event: string;
  outcome: AuditOutcome;
  walletAddress?: string | null;
  metadata?: Record<string, unknown>;
};

function normalizeHeaderValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getRequestedTrackingId(req: Request): string | null {
  const direct = normalizeHeaderValue(req.headers[TRACKING_ID_HEADER]);
  if (direct) return direct;

  const requestId = req.headers["x-request-id"];
  if (Array.isArray(requestId)) {
    return normalizeHeaderValue(requestId[0]);
  }
  return normalizeHeaderValue(requestId);
}

function generateTrackingId(): string {
  const randomId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");
  return randomId.replace(/-/g, "");
}

export function getOrCreateTrackingId(req: Request, res: Response): string {
  const existing = res.locals?.trackingId;
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  const trackingId = getRequestedTrackingId(req) || generateTrackingId();
  res.locals.trackingId = trackingId;
  res.setHeader(TRACKING_ID_HEADER, trackingId);
  return trackingId;
}

export function getTrackingId(req: Request, res: Response): string {
  return getOrCreateTrackingId(req, res);
}

export function maskWalletAddress(walletAddress?: string | null): string | null {
  if (!walletAddress) return null;
  const normalized = walletAddress.trim();
  if (normalized.length <= 10) return normalized;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

export function auditLog(entry: AuditEntry): void {
  const payload = {
    timestamp: new Date().toISOString(),
    trackingId: entry.trackingId,
    event: entry.event,
    outcome: entry.outcome,
    walletAddress: maskWalletAddress(entry.walletAddress),
    ...(entry.metadata ? { metadata: entry.metadata } : {}),
  };
  console.log(`[Audit] ${JSON.stringify(payload)}`);
}

export { TRACKING_ID_HEADER };
