import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import type { TrpcContext } from "./_core/context";
import { publicProcedure, router } from "./_core/trpc";
import { auditLog } from "./_core/observability";
import { z } from "zod";
import { mockRewardsRouter, mockReferralRouter, mockAdminRouter } from "./mockRouters";
import {
  getOrCreateWalletProfile,
  getWalletProfile,
  claimConnectBonus,
  connectXAccount,
  disconnectXAccount,
  connectDiscordAccount,
  disconnectDiscordAccount,
  completeDailyPost,
  isDailyPostCompleted,
  getPointsHistory,
  getUTCDateString,
  getAllWalletProfiles,
  getAdminStats,
  searchWalletProfiles,
  adjustUserPoints,
  getDailyPostCompletions,
  revokeTweetPoints,
  getUserActivityStats,
  // Referral functions
  applyReferralCode,
  claimReferralBonus,
  getReferralStats,
  getReferralTier,
  getAllReferrals,
  getReferralLeaderboard,
  getAdminReferralStats,
  getActivityData,
  verifyDiscordServer,
  checkUserDiscordMembership,
  checkAndRevokeDeletedTweets,
  cronCheckAllTweets,
  inferChainTypeFromWalletAddress,
} from "./db";

const useMock = process.env.REWARDS_MOCK === "1";
const REWARDS_IDENTITY_COOKIE = "perpx_rewards_wallet";
const REWARDS_IDENTITY_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function normalizeWalletAddress(value?: string | null): string | null {
  const normalized = (value || "").trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCookieValue(cookieHeader: string, key: string): string | null {
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const cookieKey = pair.slice(0, idx).trim();
    if (cookieKey !== key) continue;
    const cookieValue = pair.slice(idx + 1).trim();
    try {
      return decodeURIComponent(cookieValue);
    } catch {
      return cookieValue;
    }
  }
  return null;
}

function getRewardsCookieDomain(hostHeader?: string): string | undefined {
  if (!hostHeader) return undefined;
  const host = hostHeader.split(":")[0]?.toLowerCase() || "";
  if (host === "perpx.fi" || host.endsWith(".perpx.fi")) {
    return ".perpx.fi";
  }
  return undefined;
}

function isSecureRequest(ctx: TrpcContext): boolean {
  const forwardedProto = ctx.req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string") {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return ctx.req.protocol === "https";
}

function getHeaderWalletIdentity(ctx: TrpcContext): string | null {
  const raw = ctx.req.headers["x-perpx-rewards-wallet"];
  if (typeof raw === "string") return normalizeWalletAddress(raw);
  if (Array.isArray(raw) && raw.length > 0) return normalizeWalletAddress(raw[0]);
  return null;
}

function getCookieWalletIdentity(ctx: TrpcContext): string | null {
  const cookieHeader = typeof ctx.req.headers.cookie === "string" ? ctx.req.headers.cookie : "";
  if (!cookieHeader) return null;
  return normalizeWalletAddress(parseCookieValue(cookieHeader, REWARDS_IDENTITY_COOKIE));
}

function setRewardsWalletIdentity(ctx: TrpcContext, walletAddress: string) {
  const hostHeader = typeof ctx.req.headers.host === "string" ? ctx.req.headers.host : undefined;
  const cookieDomain = getRewardsCookieDomain(hostHeader);
  const secure = isSecureRequest(ctx);
  // If the frontend is on a different site (e.g. Vercel preview domain),
  // SameSite=Lax cookies won't be sent for XHR/fetch. Use SameSite=None on HTTPS
  // so the rewards identity stays sticky even across cross-site requests.
  const sameSite = secure ? ("none" as const) : ("lax" as const);
  ctx.res.cookie(REWARDS_IDENTITY_COOKIE, walletAddress, {
    httpOnly: false,
    secure,
    sameSite,
    path: "/",
    maxAge: REWARDS_IDENTITY_MAX_AGE_MS,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

function clearRewardsWalletIdentity(ctx: TrpcContext) {
  const hostHeader = typeof ctx.req.headers.host === "string" ? ctx.req.headers.host : undefined;
  const cookieDomain = getRewardsCookieDomain(hostHeader);
  const secure = isSecureRequest(ctx);
  const sameSite = secure ? ("none" as const) : ("lax" as const);
  ctx.res.clearCookie(REWARDS_IDENTITY_COOKIE, {
    httpOnly: false,
    secure,
    sameSite,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

function resolveRewardsWalletAddress(ctx: TrpcContext, requestedWalletAddress: string): string {
  const requested = normalizeWalletAddress(requestedWalletAddress) || requestedWalletAddress;
  const cookieWallet = getCookieWalletIdentity(ctx);
  // IMPORTANT: Once a rewards identity cookie exists, do NOT let the header override it.
  // Otherwise a wallet switch (which updates the header) would create a brand new wallet_profile
  // and effectively "split" a single user into multiple rows in admin.
  const headerWallet = cookieWallet ? null : getHeaderWalletIdentity(ctx);
  const resolved = cookieWallet || headerWallet || requested;
  const source = cookieWallet ? "cookie" : headerWallet ? "header" : "request";

  if (resolved !== requested || source !== "request") {
    auditLog({
      trackingId: ctx.trackingId,
      event: "rewards.identity.resolve",
      outcome: "success",
      walletAddress: resolved,
      metadata: {
        source,
        requestedWallet: requested,
        ...ctx.requestAudit,
      },
    });
  }

  // Keep rewards/referral identity sticky in browser until explicit disconnect.
  setRewardsWalletIdentity(ctx, resolved);
  return resolved;
}

function getWalletFromInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  if (typeof data.walletAddress === "string") {
    return normalizeWalletAddress(data.walletAddress);
  }
  if (typeof data.referredWallet === "string") {
    return normalizeWalletAddress(data.referredWallet);
  }
  return null;
}

const auditedRewardsProcedure = publicProcedure.use(async ({ ctx, path, type, input, next }) => {
  const startedAt = Date.now();
  const walletAddress = getWalletFromInput(input);
  const shouldLog = type === "mutation" || path === "rewards.getProfile";

  try {
    const result = await next();
    if (shouldLog) {
      auditLog({
        trackingId: ctx.trackingId,
        event: `trpc.${path}`,
        outcome: "success",
        walletAddress,
        metadata: {
          type,
          durationMs: Date.now() - startedAt,
          ...ctx.requestAudit,
        },
      });
    }
    return result;
  } catch (error) {
    auditLog({
      trackingId: ctx.trackingId,
      event: `trpc.${path}`,
      outcome: "error",
      walletAddress,
      metadata: {
        type,
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
        ...ctx.requestAudit,
      },
    });
    throw error;
  }
});

const auditedReferralProcedure = publicProcedure.use(async ({ ctx, path, type, input, next }) => {
  const startedAt = Date.now();
  const walletAddress = getWalletFromInput(input);

  try {
    const result = await next();
    if (type === "mutation") {
      auditLog({
        trackingId: ctx.trackingId,
        event: `trpc.${path}`,
        outcome: "success",
        walletAddress,
        metadata: {
          type,
          durationMs: Date.now() - startedAt,
          ...ctx.requestAudit,
        },
      });
    }
    return result;
  } catch (error) {
    auditLog({
      trackingId: ctx.trackingId,
      event: `trpc.${path}`,
      outcome: "error",
      walletAddress,
      metadata: {
        type,
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
        ...ctx.requestAudit,
      },
    });
    throw error;
  }
});

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Rewards System API
  rewards: useMock ? mockRewardsRouter : router({
    resetIdentity: auditedRewardsProcedure.mutation(({ ctx }) => {
      clearRewardsWalletIdentity(ctx);
      return { success: true };
    }),

    // Get or create wallet profile (called on wallet connect)
    getProfile: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        chainType: z.enum(["evm", "tron", "solana"]),
      }))
      .query(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        const identityChainType = inferChainTypeFromWalletAddress(walletAddress) || input.chainType;
        // Check Discord server membership if user is verified (auto-revoke if left)
        await checkUserDiscordMembership(walletAddress);

        // Re-fetch profile after potential membership revocation
        const profile = await getOrCreateWalletProfile(walletAddress, identityChainType);
        if (!profile) {
          return null;
        }
        const dailyPostCompleted = profile.xConnected 
          ? await isDailyPostCompleted(walletAddress)
          : false;
        const todayUTC = getUTCDateString();
        
        return {
          ...profile,
          dailyPostCompleted,
          todayUTC,
        };
      }),

    // Claim connect bonus (300 points)
    claimConnectBonus: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await claimConnectBonus(walletAddress);
      }),

    // Connect X (Twitter) account
    connectX: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        xUsername: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await connectXAccount(walletAddress, input.xUsername);
      }),

    // Disconnect X account
    disconnectX: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await disconnectXAccount(walletAddress);
      }),

    // Connect Discord account
    connectDiscord: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        discordUsername: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await connectDiscordAccount(walletAddress, input.discordUsername);
      }),

    verifyDiscordServer: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await verifyDiscordServer(walletAddress);
      }),

    // Disconnect Discord account
    disconnectDiscord: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await disconnectDiscordAccount(walletAddress);
      }),

    // Complete daily post task
    completeDailyPost: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        tweetUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await completeDailyPost(walletAddress, input.tweetUrl);
      }),

    // Get points history
    getHistory: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        limit: z.number().min(1).max(100).optional().default(50),
      }))
      .query(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await getPointsHistory(walletAddress, input.limit);
      }),

    // Check and revoke deleted tweets for a specific wallet
    checkTweets: auditedRewardsProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await checkAndRevokeDeletedTweets(walletAddress);
      }),

    // Get OAuth configuration status
    getOAuthStatus: auditedRewardsProcedure
      .query(() => {
        const X_CLIENT_ID = process.env.X_CLIENT_ID || "";
        const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || "";
        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
        const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
        
        return {
          x: {
            configured: !!X_CLIENT_ID && !!X_CLIENT_SECRET,
            clientIdSet: !!X_CLIENT_ID,
          },
          discord: {
            configured: !!DISCORD_CLIENT_ID && !!DISCORD_CLIENT_SECRET,
            clientIdSet: !!DISCORD_CLIENT_ID,
          },
        };
      }),
  }),

  // Referral System API
  referral: useMock ? mockReferralRouter : router({
    // Check if user can generate referral code (requires X + Discord connection)
    canGenerateCode: auditedReferralProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .query(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        const profile = await getWalletProfile(walletAddress);
        if (!profile) {
          return { canGenerate: false, hasCode: false, reason: "Profile not found" };
        }
        return {
          canGenerate: profile.xConnected && profile.discordConnected && profile.discordVerified,
          hasCode: !!profile.referralCode,
          referralCode: profile.referralCode,
          xConnected: profile.xConnected,
          discordConnected: profile.discordConnected,
          discordVerified: profile.discordVerified,
          reason: !profile.xConnected && !profile.discordConnected 
            ? "Connect X and Discord to get your referral code"
            : !profile.xConnected 
              ? "Connect X to get your referral code"
              : !profile.discordConnected 
                ? "Connect Discord to get your referral code"
                : !profile.discordVerified
                  ? "Verify Discord server membership to get your referral code"
                  : null,
        };
      }),

    // Get referral stats for a wallet
    getStats: auditedReferralProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
      }))
      .query(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await getReferralStats(walletAddress);
      }),

    // Apply a referral code
    applyCode: auditedReferralProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        referralCode: z.string().min(1).max(16),
      }))
      .mutation(async ({ input, ctx }) => {
        const walletAddress = resolveRewardsWalletAddress(ctx, input.walletAddress);
        return await applyReferralCode(walletAddress, input.referralCode);
      }),

    // Claim referral bonus (triggered when referred user completes qualifying action)
    claimBonus: auditedReferralProcedure
      .input(z.object({
        referredWallet: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return await claimReferralBonus(input.referredWallet);
      }),

    // Get referral leaderboard
    getLeaderboard: auditedReferralProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional().default(10),
      }))
      .query(async ({ input }) => {
        return await getReferralLeaderboard(input.limit);
      }),

    // Get tier info for a referral count
    getTierInfo: auditedReferralProcedure
      .input(z.object({
        referralCount: z.number().min(0),
      }))
      .query(({ input }) => {
        return getReferralTier(input.referralCount);
      }),
  }),

  // Admin API (protected by admin password)
  admin: useMock ? mockAdminRouter : router({
    // Verify admin password
    verifyPassword: publicProcedure
      .input(z.object({
        password: z.string().min(1),
      }))
      .mutation(({ input }) => {
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "perpdex_admin_2026";
        return {
          valid: input.password === ADMIN_PASSWORD,
        };
      }),

    // Get dashboard statistics
    getStats: publicProcedure
      .query(async () => {
        return await getAdminStats();
      }),

    // Get all users with pagination
    getUsers: publicProcedure
      .input(z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(50),
        sortBy: z.enum(["totalPoints", "createdAt"]).optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }))
      .query(async ({ input }) => {
        return await getAllWalletProfiles(input.page, input.limit);
      }),

    // Search users
    searchUsers: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).optional().default(20),
      }))
      .query(async ({ input }) => {
        return await searchWalletProfiles(input.query, 1, input.limit);
      }),

    // Adjust user points
    adjustPoints: publicProcedure
      .input(z.object({
        walletAddress: z.string().min(1),
        pointsChange: z.number(),
        reason: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return await adjustUserPoints(
          input.walletAddress,
          input.pointsChange,
          input.reason
        );
      }),

    // Get daily post completions with tweet URLs
    getDailyPosts: publicProcedure
      .input(z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(50),
        date: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getDailyPostCompletions(input.date);
      }),

    // Revoke points for a deleted tweet
    revokeTweetPoints: publicProcedure
      .input(z.object({
        completionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await revokeTweetPoints(input.completionId);
      }),

    // Get all referrals with pagination
    getReferrals: publicProcedure
      .input(z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(50),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }))
      .query(async ({ input }) => {
        return await getAllReferrals(input.page, input.limit);
      }),

    // Get referral statistics for admin dashboard
    getReferralStats: publicProcedure
      .query(async () => {
        return await getAdminReferralStats();
      }),

    getActivityData: publicProcedure
      .query(async () => {
        return await getActivityData();
      }),

    // Trigger cron check for all tweets (admin only)
    cronCheckTweets: publicProcedure
      .mutation(async () => {
        return await cronCheckAllTweets();
      }),

  }),
});

export type AppRouter = typeof appRouter;
