import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import {
  getOrCreateWalletProfile,
  getWalletProfile,
  claimConnectBonus,
  connectXAccount,
  disconnectXAccount,
  connectDiscordAccount,
  disconnectDiscordAccount,
  completeDailyPost,
  getPointsHistory,
  getReferralStats,
  applyReferralCode,
  claimReferralBonus,
  getReferralLeaderboard,
  getAllWalletProfiles,
  getAdminStats,
  searchWalletProfiles,
  adjustUserPoints,
  getDailyPostCompletions,
  revokeTweetPoints,
  getAllReferrals,
  getAdminReferralStats,
  getActivityData,
  verifyDiscordServer,
  isDailyPostCompleted,
  getUTCDateString,
  checkAndRevokeDeletedTweets,
  cronCheckAllTweets,
} from "./mockStore";
import { getReferralTier } from "./db";

export const mockRewardsRouter = router({
  getProfile: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      chainType: z.enum(["evm", "tron", "solana"]),
    }))
    .query(({ input }) => {
      const profile = getOrCreateWalletProfile(input.walletAddress, input.chainType);
      if (!profile) {
        return null;
      }
      const dailyPostCompleted = isDailyPostCompleted(input.walletAddress);
      const todayUTC = getUTCDateString();
      return {
        ...profile,
        dailyPostCompleted,
        todayUTC,
      };
    }),

  claimConnectBonus: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return claimConnectBonus(input.walletAddress);
    }),

  connectX: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      xUsername: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return connectXAccount(input.walletAddress, input.xUsername);
    }),

  disconnectX: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return disconnectXAccount(input.walletAddress);
    }),

  connectDiscord: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      discordUsername: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return connectDiscordAccount(input.walletAddress, input.discordUsername);
    }),

  verifyDiscordServer: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return verifyDiscordServer(input.walletAddress);
    }),

  disconnectDiscord: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return disconnectDiscordAccount(input.walletAddress);
    }),

  completeDailyPost: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      tweetUrl: z.string().optional(),
    }))
    .mutation(({ input }) => {
      return completeDailyPost(input.walletAddress, input.tweetUrl);
    }),

  getHistory: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(({ input }) => {
      return getPointsHistory(input.walletAddress, 1, input.limit);
    }),

  checkTweets: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return checkAndRevokeDeletedTweets(input.walletAddress);
    }),

  getOAuthStatus: publicProcedure
    .query(() => {
      return {
        x: { configured: false, clientIdSet: false },
        discord: { configured: false, clientIdSet: false },
      };
    }),
});

export const mockReferralRouter = router({
  canGenerateCode: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .query(({ input }) => {
      const profile = getWalletProfile(input.walletAddress);
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

  getStats: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
    }))
    .query(({ input }) => {
      return getReferralStats(input.walletAddress);
    }),

  applyCode: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      referralCode: z.string().min(1).max(16),
    }))
    .mutation(({ input }) => {
      return applyReferralCode(input.walletAddress, input.referralCode);
    }),

  claimBonus: publicProcedure
    .input(z.object({
      referredWallet: z.string().min(1),
    }))
    .mutation(({ input }) => {
      return claimReferralBonus(input.referredWallet);
    }),

  getLeaderboard: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(({ input }) => {
      return getReferralLeaderboard(input.limit);
    }),

  getTierInfo: publicProcedure
    .input(z.object({
      referralCount: z.number().min(0),
    }))
    .query(({ input }) => {
      return getReferralTier(input.referralCount);
    }),
});

export const mockAdminRouter = router({
  verifyPassword: publicProcedure
    .input(z.object({
      password: z.string().min(1),
    }))
    .mutation(({ input }) => {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "perpdex_admin_2026";
      return { valid: input.password === ADMIN_PASSWORD };
    }),

  getStats: publicProcedure
    .query(() => {
      return getAdminStats();
    }),

  getUsers: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(50),
      sortBy: z.enum(["totalPoints", "createdAt"]).optional().default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    }))
    .query(({ input }) => {
      const result = getAllWalletProfiles(input.page, input.limit);
      if (input.sortBy === "totalPoints") {
        result.profiles.sort((a: any, b: any) =>
          input.sortOrder === "asc" ? a.totalPoints - b.totalPoints : b.totalPoints - a.totalPoints
        );
      } else {
        result.profiles.sort((a: any, b: any) =>
          input.sortOrder === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return result;
    }),

  searchUsers: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(({ input }) => {
      return searchWalletProfiles(input.query, 1, input.limit);
    }),

  adjustPoints: publicProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      pointsChange: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(({ input }) => {
      const newTotal = adjustUserPoints(input.walletAddress, input.pointsChange, input.reason);
      return {
        success: true,
        message: `Points adjusted by ${input.pointsChange >= 0 ? "+" : ""}${input.pointsChange}`,
        newTotal,
      };
    }),

  getDailyPosts: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(50),
      date: z.string().optional(),
    }))
    .query(() => {
      return getDailyPostCompletions();
    }),

  revokeTweetPoints: publicProcedure
    .input(z.object({
      completionId: z.number(),
    }))
    .mutation(({ input }) => {
      return revokeTweetPoints(input.completionId);
    }),

  getReferrals: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(50),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    }))
    .query(({ input }) => {
      return getAllReferrals(input.page, input.limit);
    }),

  getReferralStats: publicProcedure
    .query(() => {
      return getAdminReferralStats();
    }),

  getActivityData: publicProcedure
    .query(() => {
      return getActivityData();
    }),

  cronCheckTweets: publicProcedure
    .mutation(() => {
      return cronCheckAllTweets();
    }),
});
