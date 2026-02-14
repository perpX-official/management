/**
 * Social OAuth Routes for X (Twitter) and Discord
 * 
 * This module handles OAuth 2.0 authentication flows for social platforms.
 * Users connect their social accounts to earn rewards points.
 */

import { Router, Request, Response } from "express";
import { connectXAccount, connectDiscordAccount, getWalletProfile } from "./db";
import { auditLog, getRequestAuditContext, getTrackingId } from "./_core/observability";

const router = Router();

// Environment variables for OAuth (to be set by user)
const X_CLIENT_ID = process.env.X_CLIENT_ID || "";
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || "";
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";

function normalizeOrigin(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function getAllowedFrontendOrigins(): string[] {
  const allowed = new Set<string>();

  const explicitFrontend = normalizeOrigin(process.env.FRONTEND_BASE_URL || "");
  if (explicitFrontend) allowed.add(explicitFrontend);

  const corsOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((v) => normalizeOrigin(v.trim()))
    .filter((v): v is string => !!v);
  for (const origin of corsOrigins) allowed.add(origin);

  return Array.from(allowed);
}

function resolveFrontendOrigin(req: Request, requestedOrigin?: string): string {
  const normalizedRequested = normalizeOrigin(requestedOrigin || "");
  const allowed = getAllowedFrontendOrigins();

  if (normalizedRequested && (allowed.length === 0 || allowed.includes(normalizedRequested))) {
    return normalizedRequested;
  }

  if (allowed.length > 0) {
    return allowed[0];
  }

  return getBaseUrl(req);
}

function makeRewardsRedirect(frontendOrigin: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${frontendOrigin}/rewards${query ? `?${query}` : ""}`;
}

/**
 * Get the base URL for OAuth callbacks
 * 
 * Priority:
 * 1. OAUTH_CALLBACK_BASE_URL env var (explicit override)
 * 2. VERCEL_URL env var (auto-set by Vercel)
 * 3. Request headers (x-forwarded-proto/host)
 * 4. Default localhost for development
 * 
 * IMPORTANT: When deploying to Vercel with custom domain:
 * - Set OAUTH_CALLBACK_BASE_URL to backend domain (e.g., https://api.perpx.fi)
 * - Set FRONTEND_BASE_URL to frontend domain (e.g., https://perpx.fi)
 * - Update X Developer Portal redirect URI to: https://api.perpx.fi/api/social/x/callback
 * - Update Discord Developer Portal redirect URI to: https://api.perpx.fi/api/social/discord/callback
 */
function getBaseUrl(req: Request): string {
  // 1. Explicit override (recommended for production with custom domain)
  if (process.env.OAUTH_CALLBACK_BASE_URL) {
    // Remove trailing slash and any path (keep only protocol + host)
    const url = process.env.OAUTH_CALLBACK_BASE_URL.replace(/\/$/, "");
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  }
  
  // 2. Vercel auto-generated URL (for preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Use request headers (works for most cases)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // 4. Default for local development
  return "http://localhost:3000";
}

// ============================================
// X (Twitter) OAuth 2.0 with PKCE
// ============================================

// Store PKCE verifiers and state temporarily (in production, use Redis or DB)
const pendingOAuthStates = new Map<string, { 
  walletAddress: string; 
  codeVerifier: string;
  frontendOrigin: string;
  createdAt: number;
}>();

// Clean up old states (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of Array.from(pendingOAuthStates.entries())) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingOAuthStates.delete(state);
    }
  }
}, 60 * 1000);

// Generate random string for state and PKCE
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate PKCE code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * X OAuth - Initiate Authorization
 * GET /api/social/x/auth?wallet=0x...
 */
router.get("/x/auth", async (req: Request, res: Response) => {
  const trackingId = getTrackingId(req, res);
  const requestAudit = getRequestAuditContext(req);
  const walletAddress = req.query.wallet as string;
  const requestedOrigin = (req.query.redirect as string) || "";
  
  if (!walletAddress) {
    auditLog({
      trackingId,
      event: "oauth.x.auth",
      outcome: "blocked",
      metadata: { reason: "wallet_missing", ...requestAudit },
    });
    return res.status(400).json({ error: "Wallet address required" });
  }

  if (!X_CLIENT_ID) {
    auditLog({
      trackingId,
      event: "oauth.x.auth",
      outcome: "error",
      walletAddress,
      metadata: { reason: "x_client_not_configured", ...requestAudit },
    });
    return res.status(500).json({ error: "X OAuth not configured. Please set X_CLIENT_ID and X_CLIENT_SECRET." });
  }

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state for callback verification
  pendingOAuthStates.set(state, {
    walletAddress,
    codeVerifier,
    frontendOrigin: resolveFrontendOrigin(req, requestedOrigin),
    createdAt: Date.now(),
  });

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/social/x/callback`;

  // X OAuth 2.0 authorization URL
  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", X_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "tweet.read users.read offline.access");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  auditLog({
    trackingId,
    event: "oauth.x.auth",
    outcome: "success",
    walletAddress,
    metadata: {
      redirectUri,
      frontendOrigin: pendingOAuthStates.get(state)?.frontendOrigin || null,
      ...requestAudit,
    },
  });
  res.redirect(authUrl.toString());
});

/**
 * X OAuth - Callback Handler
 * GET /api/social/x/callback?code=...&state=...
 */
router.get("/x/callback", async (req: Request, res: Response) => {
  const trackingId = getTrackingId(req, res);
  const requestAudit = getRequestAuditContext(req);
  const { code, state, error } = req.query;
  const defaultFrontendOrigin = resolveFrontendOrigin(req);

  if (error) {
    auditLog({
      trackingId,
      event: "oauth.x.callback",
      outcome: "blocked",
      metadata: { reason: "provider_denied", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "x_auth_denied" }));
  }

  if (!code || !state) {
    auditLog({
      trackingId,
      event: "oauth.x.callback",
      outcome: "blocked",
      metadata: { reason: "missing_code_or_state", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "x_auth_invalid" }));
  }

  const pendingState = pendingOAuthStates.get(state as string);
  if (!pendingState) {
    auditLog({
      trackingId,
      event: "oauth.x.callback",
      outcome: "blocked",
      metadata: { reason: "state_expired_or_not_found", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "x_auth_expired" }));
  }

  pendingOAuthStates.delete(state as string);
  const frontendOrigin = pendingState.frontendOrigin || defaultFrontendOrigin;

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/social/x/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
        code_verifier: pendingState.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("X token exchange failed:", await tokenResponse.text());
      auditLog({
        trackingId,
        event: "oauth.x.callback",
        outcome: "error",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "token_exchange_failed", ...requestAudit },
      });
      return res.redirect(makeRewardsRedirect(frontendOrigin, { error: "x_token_failed" }));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from X API
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("X user fetch failed:", await userResponse.text());
      auditLog({
        trackingId,
        event: "oauth.x.callback",
        outcome: "error",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "user_fetch_failed", ...requestAudit },
      });
      return res.redirect(makeRewardsRedirect(frontendOrigin, { error: "x_user_failed" }));
    }

    const userData = await userResponse.json();
    const xUsername = userData.data.username;

    // Connect X account in database
    const result = await connectXAccount(pendingState.walletAddress, xUsername);

    if (result.success) {
      auditLog({
        trackingId,
        event: "oauth.x.callback",
        outcome: "success",
        walletAddress: pendingState.walletAddress,
        metadata: { xUsername, ...requestAudit },
      });
      res.redirect(makeRewardsRedirect(frontendOrigin, { success: "x_connected", username: xUsername }));
    } else {
      auditLog({
        trackingId,
        event: "oauth.x.callback",
        outcome: "warn",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "already_connected", ...requestAudit },
      });
      res.redirect(makeRewardsRedirect(frontendOrigin, { error: "x_already_connected" }));
    }
  } catch (err) {
    console.error("X OAuth error:", err);
    auditLog({
      trackingId,
      event: "oauth.x.callback",
      outcome: "error",
      walletAddress: pendingState.walletAddress,
      metadata: { reason: "exception", ...requestAudit },
    });
    res.redirect(makeRewardsRedirect(frontendOrigin, { error: "x_auth_error" }));
  }
});

// ============================================
// Discord OAuth 2.0
// ============================================

const pendingDiscordStates = new Map<string, {
  walletAddress: string;
  frontendOrigin: string;
  createdAt: number;
}>();

// Clean up old Discord states
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of Array.from(pendingDiscordStates.entries())) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingDiscordStates.delete(state);
    }
  }
}, 60 * 1000);

/**
 * Discord OAuth - Initiate Authorization
 * GET /api/social/discord/auth?wallet=0x...
 */
router.get("/discord/auth", async (req: Request, res: Response) => {
  const trackingId = getTrackingId(req, res);
  const requestAudit = getRequestAuditContext(req);
  const walletAddress = req.query.wallet as string;
  const requestedOrigin = (req.query.redirect as string) || "";

  if (!walletAddress) {
    auditLog({
      trackingId,
      event: "oauth.discord.auth",
      outcome: "blocked",
      metadata: { reason: "wallet_missing", ...requestAudit },
    });
    return res.status(400).json({ error: "Wallet address required" });
  }

  if (!DISCORD_CLIENT_ID) {
    auditLog({
      trackingId,
      event: "oauth.discord.auth",
      outcome: "error",
      walletAddress,
      metadata: { reason: "discord_client_not_configured", ...requestAudit },
    });
    return res.status(500).json({ error: "Discord OAuth not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET." });
  }

  const state = generateRandomString(32);

  pendingDiscordStates.set(state, {
    walletAddress,
    frontendOrigin: resolveFrontendOrigin(req, requestedOrigin),
    createdAt: Date.now(),
  });

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/social/discord/callback`;

  // Discord OAuth 2.0 authorization URL
  const authUrl = new URL("https://discord.com/api/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "identify");
  authUrl.searchParams.set("state", state);

  auditLog({
    trackingId,
    event: "oauth.discord.auth",
    outcome: "success",
    walletAddress,
    metadata: {
      redirectUri,
      frontendOrigin: pendingDiscordStates.get(state)?.frontendOrigin || null,
      ...requestAudit,
    },
  });
  res.redirect(authUrl.toString());
});

/**
 * Discord OAuth - Callback Handler
 * GET /api/social/discord/callback?code=...&state=...
 */
router.get("/discord/callback", async (req: Request, res: Response) => {
  const trackingId = getTrackingId(req, res);
  const requestAudit = getRequestAuditContext(req);
  const { code, state, error } = req.query;
  const defaultFrontendOrigin = resolveFrontendOrigin(req);

  if (error) {
    auditLog({
      trackingId,
      event: "oauth.discord.callback",
      outcome: "blocked",
      metadata: { reason: "provider_denied", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "discord_auth_denied" }));
  }

  if (!code || !state) {
    auditLog({
      trackingId,
      event: "oauth.discord.callback",
      outcome: "blocked",
      metadata: { reason: "missing_code_or_state", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "discord_auth_invalid" }));
  }

  const pendingState = pendingDiscordStates.get(state as string);
  if (!pendingState) {
    auditLog({
      trackingId,
      event: "oauth.discord.callback",
      outcome: "blocked",
      metadata: { reason: "state_expired_or_not_found", ...requestAudit },
    });
    return res.redirect(makeRewardsRedirect(defaultFrontendOrigin, { error: "discord_auth_expired" }));
  }

  pendingDiscordStates.delete(state as string);
  const frontendOrigin = pendingState.frontendOrigin || defaultFrontendOrigin;

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/social/discord/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", await tokenResponse.text());
      auditLog({
        trackingId,
        event: "oauth.discord.callback",
        outcome: "error",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "token_exchange_failed", ...requestAudit },
      });
      return res.redirect(makeRewardsRedirect(frontendOrigin, { error: "discord_token_failed" }));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Discord API
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Discord user fetch failed:", await userResponse.text());
      auditLog({
        trackingId,
        event: "oauth.discord.callback",
        outcome: "error",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "user_fetch_failed", ...requestAudit },
      });
      return res.redirect(makeRewardsRedirect(frontendOrigin, { error: "discord_user_failed" }));
    }

    const userData = await userResponse.json();
    const discordUsername = userData.global_name || userData.username;
    const discordId = userData.id;

    // Connect Discord account in database
    const result = await connectDiscordAccount(pendingState.walletAddress, discordUsername, discordId);

    if (result.success) {
      auditLog({
        trackingId,
        event: "oauth.discord.callback",
        outcome: "success",
        walletAddress: pendingState.walletAddress,
        metadata: { discordId, discordUsername, ...requestAudit },
      });
      res.redirect(makeRewardsRedirect(frontendOrigin, { success: "discord_connected", username: discordUsername }));
    } else {
      auditLog({
        trackingId,
        event: "oauth.discord.callback",
        outcome: "warn",
        walletAddress: pendingState.walletAddress,
        metadata: { reason: "already_connected", ...requestAudit },
      });
      res.redirect(makeRewardsRedirect(frontendOrigin, { error: "discord_already_connected" }));
    }
  } catch (err) {
    console.error("Discord OAuth error:", err);
    auditLog({
      trackingId,
      event: "oauth.discord.callback",
      outcome: "error",
      walletAddress: pendingState.walletAddress,
      metadata: { reason: "exception", ...requestAudit },
    });
    res.redirect(makeRewardsRedirect(frontendOrigin, { error: "discord_auth_error" }));
  }
});

/**
 * Check OAuth configuration status
 * GET /api/social/status
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    x: {
      configured: !!X_CLIENT_ID && !!X_CLIENT_SECRET,
      clientIdSet: !!X_CLIENT_ID,
    },
    discord: {
      configured: !!DISCORD_CLIENT_ID && !!DISCORD_CLIENT_SECRET,
      clientIdSet: !!DISCORD_CLIENT_ID,
    },
  });
});

export default router;
