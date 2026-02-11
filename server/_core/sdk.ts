import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  walletAddress: string;
  appId: string;
  name: string;
};

/**
 * Wallet-based authentication service
 * Replaces Manus OAuth with wallet signature verification
 */
class WalletAuthService {
  constructor() {
    console.log("[Auth] Wallet-based authentication initialized");
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a wallet address
   * @example
   * const sessionToken = await sdk.createSessionToken(walletAddress);
   */
  async createSessionToken(
    walletAddress: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        walletAddress,
        appId: ENV.appId || "perpdex",
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      walletAddress: payload.walletAddress,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ walletAddress: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { walletAddress, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(walletAddress)) {
        console.warn("[Auth] Session payload missing wallet address");
        return null;
      }

      return {
        walletAddress,
        appId: isNonEmptyString(appId) ? appId : "perpdex",
        name: isNonEmptyString(name) ? name : "",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User | null> {
    // Parse session cookie
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      // No session - return null (public access allowed)
      return null;
    }

    const walletAddress = session.walletAddress;
    const signedInAt = new Date();
    
    // Get or create user by wallet address
    let user = await db.getUserByWallet(walletAddress);

    if (!user) {
      // Create new user for this wallet
      try {
        await db.upsertUserByWallet(walletAddress, session.name || undefined);
        user = await db.getUserByWallet(walletAddress);
      } catch (error) {
        console.error("[Auth] Failed to create user:", error);
        throw ForbiddenError("Failed to create user");
      }
    } else {
      // Update last signed in
      await db.upsertUserByWallet(walletAddress);
    }

    return user || null;
  }

  /**
   * Verify wallet signature (for SIWE - Sign-In with Ethereum)
   * This is called from the frontend after wallet signature
   */
  async verifyWalletSignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      // Import ethers for signature verification
      const { ethers } = await import("ethers");
      
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare addresses (case-insensitive)
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error("[Auth] Signature verification failed:", error);
      return false;
    }
  }
}

export const sdk = new WalletAuthService();
