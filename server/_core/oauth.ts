import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { auditLog, getRequestAuditContext, getTrackingId } from "./observability";

/**
 * Register wallet-based authentication routes
 * Replaces Manus OAuth with wallet signature verification
 */
export function registerOAuthRoutes(app: Express) {
  /**
   * Wallet authentication endpoint
   * Called after frontend wallet signature verification
   */
  app.post("/api/auth/wallet", async (req: Request, res: Response) => {
    const trackingId = getTrackingId(req, res);
    const requestAudit = getRequestAuditContext(req);
    const { walletAddress, signature, message, chainType } = req.body;

    if (!walletAddress) {
      auditLog({
        trackingId,
        event: "auth.wallet",
        outcome: "blocked",
        metadata: { reason: "wallet_missing", ...requestAudit },
      });
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    try {
      // If signature is provided, verify it
      if (signature && message) {
        const isValid = await sdk.verifyWalletSignature(message, signature, walletAddress);
        if (!isValid) {
          auditLog({
            trackingId,
            event: "auth.wallet",
            outcome: "blocked",
            walletAddress,
            metadata: { reason: "invalid_signature", ...requestAudit },
          });
          res.status(401).json({ error: "Invalid signature" });
          return;
        }
      }

      // Create or update user by wallet address
      await db.upsertUserByWallet(walletAddress);

      // Create session token
      const sessionToken = await sdk.createSessionToken(walletAddress, {
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Get or create wallet profile for rewards system
      const chain = chainType || "evm";
      const profile = await db.getOrCreateWalletProfile(walletAddress, chain);

      auditLog({
        trackingId,
        event: "auth.wallet",
        outcome: "success",
        walletAddress,
        metadata: {
          chainType: chain,
          hasSignature: !!(signature && message),
          ...requestAudit,
        },
      });
      res.json({ 
        success: true, 
        walletAddress,
        profile,
      });
    } catch (error) {
      console.error("[Auth] Wallet authentication failed", error);
      auditLog({
        trackingId,
        event: "auth.wallet",
        outcome: "error",
        walletAddress,
        metadata: { reason: "exception", ...requestAudit },
      });
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  /**
   * Logout endpoint
   */
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const trackingId = getTrackingId(req, res);
    const requestAudit = getRequestAuditContext(req);
    try {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      auditLog({
        trackingId,
        event: "auth.logout",
        outcome: "success",
        metadata: requestAudit,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed", error);
      auditLog({
        trackingId,
        event: "auth.logout",
        outcome: "error",
        metadata: requestAudit,
      });
      res.status(500).json({ error: "Logout failed" });
    }
  });

  /**
   * Get current session info
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.json({ authenticated: false, user: null });
        return;
      }
      res.json({ authenticated: true, user });
    } catch (error) {
      res.json({ authenticated: false, user: null });
    }
  });

  // Keep legacy OAuth callback for backwards compatibility (redirects to home)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // Legacy OAuth is no longer supported - redirect to home
    res.redirect(302, "/");
  });
}
