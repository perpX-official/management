import { nanoid } from "nanoid";
import { getReferralTier } from "./db";

type ChainType = "evm" | "tron" | "solana";

type MockProfile = {
  walletAddress: string;
  chainType: ChainType;
  totalPoints: number;
  connectBonusClaimed: boolean;
  xConnected: boolean;
  xUsername: string | null;
  xConnectedAt: Date | null;
  discordConnected: boolean;
  discordUsername: string | null;
  discordId: string | null;
  discordConnectedAt: Date | null;
  discordVerified: boolean;
  discordVerifiedAt: Date | null;
  referralCode: string | null;
  referralCount: number;
  referralPointsEarned: number;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockPointsHistory = {
  id: number;
  walletAddress: string;
  transactionType: string;
  pointsChange: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: Date;
};

type MockTaskCompletion = {
  id: number;
  walletAddress: string;
  taskType: string;
  pointsAwarded: number;
  completionDate: string;
  metadata?: string | null;
  status: "active" | "revoked";
  completedAt: Date;
  revokedAt?: Date | null;
};

type MockReferral = {
  id: number;
  referrerWallet: string;
  referredWallet: string;
  referrerClaimed: boolean;
  referrerPoints: number;
  referredPoints: number;
  createdAt: Date;
};

const profiles = new Map<string, MockProfile>();
const pointsHistory: MockPointsHistory[] = [];
const taskCompletions: MockTaskCompletion[] = [];
const referrals: MockReferral[] = [];

let pointsId = 1;
let taskId = 1;
let referralId = 1;

const normalize = (address: string) => address.toLowerCase();

export function getUTCDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function ensureProfile(walletAddress: string, chainType: ChainType = "evm"): MockProfile {
  const key = normalize(walletAddress);
  const existing = profiles.get(key);
  if (existing) return existing;

  const now = new Date();
  const profile: MockProfile = {
    walletAddress,
    chainType,
    totalPoints: 0,
    connectBonusClaimed: false,
    xConnected: false,
    xUsername: null,
    xConnectedAt: null,
    discordConnected: false,
    discordUsername: null,
    discordId: null,
    discordConnectedAt: null,
    discordVerified: false,
    discordVerifiedAt: null,
    referralCode: null,
    referralCount: 0,
    referralPointsEarned: 0,
    referredBy: null,
    createdAt: now,
    updatedAt: now,
  };
  profiles.set(key, profile);
  return profile;
}

function touchProfile(profile: MockProfile) {
  profile.updatedAt = new Date();
}

function maybeGenerateReferralCode(profile: MockProfile) {
  if (profile.referralCode) return;
  if (profile.xConnected && profile.discordConnected && profile.discordVerified) {
    profile.referralCode = nanoid(8).toUpperCase();
    touchProfile(profile);
  }
}

function updateReferralStats(referrerWallet: string) {
  const key = normalize(referrerWallet);
  const profile = profiles.get(key);
  if (!profile) return;
  const walletReferrals = referrals.filter(r => normalize(r.referrerWallet) === key);
  profile.referralCount = walletReferrals.length;
  profile.referralPointsEarned = walletReferrals.reduce((sum, r) => sum + r.referrerPoints, 0);
  touchProfile(profile);
}

function addPoints(
  walletAddress: string,
  points: number,
  transactionType: string,
  description?: string
) {
  const profile = ensureProfile(walletAddress);
  profile.totalPoints += points;
  touchProfile(profile);

  pointsHistory.push({
    id: pointsId++,
    walletAddress: profile.walletAddress,
    transactionType,
    pointsChange: points,
    balanceAfter: profile.totalPoints,
    description: description || null,
    createdAt: new Date(),
  });

  return profile.totalPoints;
}

function maybeClaimReferralBonus(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  if (!profile.referredBy) return;

  const referral = referrals.find(r => normalize(r.referredWallet) === normalize(walletAddress));
  if (!referral || referral.referrerClaimed) return;

  const referrerBonus = 50;
  const referredBonus = 50;

  referral.referrerClaimed = true;
  referral.referrerPoints = referrerBonus;
  referral.referredPoints = referredBonus;

  addPoints(referral.referrerWallet, referrerBonus, "referral_bonus", "Referral bonus");
  addPoints(walletAddress, referredBonus, "referral_bonus", "Referral bonus");

  updateReferralStats(referral.referrerWallet);
}

export function getOrCreateWalletProfile(walletAddress: string, chainType: ChainType = "evm") {
  return ensureProfile(walletAddress, chainType);
}

export function getWalletProfile(walletAddress: string) {
  return profiles.get(normalize(walletAddress)) || null;
}

export function getAllWalletProfiles(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const all = Array.from(profiles.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return { profiles: all.slice(offset, offset + pageSize), total: all.length };
}

export function searchWalletProfiles(query: string, page: number = 1, pageSize: number = 20) {
  const term = query.toLowerCase();
  const filtered = Array.from(profiles.values()).filter(p =>
    p.walletAddress.toLowerCase().includes(term) ||
    (p.xUsername || "").toLowerCase().includes(term) ||
    (p.discordUsername || "").toLowerCase().includes(term)
  );
  const offset = (page - 1) * pageSize;
  return { profiles: filtered.slice(offset, offset + pageSize), total: filtered.length };
}

export function getPointsHistory(walletAddress?: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const filtered = walletAddress
    ? pointsHistory.filter(h => normalize(h.walletAddress) === normalize(walletAddress))
    : pointsHistory;
  const ordered = filtered.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return { history: ordered.slice(offset, offset + pageSize), total: ordered.length };
}

export function claimConnectBonus(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  if (profile.connectBonusClaimed) {
    return { success: false, message: "Connect bonus already claimed" };
  }
  profile.connectBonusClaimed = true;
  touchProfile(profile);
  const bonusPoints = 300;
  addPoints(walletAddress, bonusPoints, "connect_bonus", "Wallet connection bonus");
  maybeClaimReferralBonus(walletAddress);
  return { success: true, message: `Earned ${bonusPoints} points for connecting wallet!`, points: bonusPoints };
}

export function connectXAccount(walletAddress: string, xUsername: string) {
  const profile = ensureProfile(walletAddress);
  if (profile.xConnected) {
    return { success: false, message: "X account already connected" };
  }
  profile.xConnected = true;
  profile.xUsername = xUsername.replace(/^@/, "");
  profile.xConnectedAt = new Date();
  touchProfile(profile);
  const bonusPoints = 100;
  addPoints(walletAddress, bonusPoints, "x_connect", `Connected X account: @${profile.xUsername}`);
  maybeGenerateReferralCode(profile);
  maybeClaimReferralBonus(walletAddress);
  return { success: true, message: `Earned ${bonusPoints} points for connecting X!`, points: bonusPoints };
}

export function disconnectXAccount(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  if (!profile.xConnected) {
    return { success: false, message: "X account not connected" };
  }
  profile.xConnected = false;
  profile.xUsername = null;
  profile.xConnectedAt = null;
  touchProfile(profile);
  addPoints(walletAddress, -100, "x_disconnect", "Disconnected X account (-100pt)");
  return { success: true, message: "X account disconnected. 100 points deducted." };
}

export function connectDiscordAccount(walletAddress: string, discordUsername: string) {
  const profile = ensureProfile(walletAddress);
  if (profile.discordConnected) {
    return { success: false, message: "Discord account already connected" };
  }
  profile.discordConnected = true;
  profile.discordUsername = discordUsername;
  profile.discordConnectedAt = new Date();
  touchProfile(profile);
  const bonusPoints = 50;
  addPoints(walletAddress, bonusPoints, "discord_connect", `Connected Discord account: ${discordUsername}`);
  maybeGenerateReferralCode(profile);
  maybeClaimReferralBonus(walletAddress);
  return { success: true, message: `Earned ${bonusPoints} points for connecting Discord!`, points: bonusPoints };
}

export function disconnectDiscordAccount(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  if (!profile.discordConnected) {
    return { success: false, message: "Discord account not connected" };
  }
  profile.discordConnected = false;
  profile.discordUsername = null;
  profile.discordId = null;
  profile.discordConnectedAt = null;
  profile.discordVerified = false;
  profile.discordVerifiedAt = null;
  touchProfile(profile);
  addPoints(walletAddress, -50, "discord_disconnect", "Disconnected Discord account (-50pt)");
  return { success: true, message: "Discord account disconnected. 50 points deducted." };
}

export function verifyDiscordServer(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  if (!profile.discordConnected) {
    return { success: false, message: "Discord account must be connected first" };
  }
  if (profile.discordVerified) {
    return { success: false, message: "Discord server already verified" };
  }
  profile.discordVerified = true;
  profile.discordVerifiedAt = new Date();
  touchProfile(profile);
  const bonusPoints = 50;
  addPoints(walletAddress, bonusPoints, "discord_verify", "Verified PerpX Discord server membership");
  maybeGenerateReferralCode(profile);
  maybeClaimReferralBonus(walletAddress);
  return { success: true, message: `Earned ${bonusPoints} points for verifying Discord server membership!`, points: bonusPoints };
}

export function completeDailyPost(walletAddress: string, tweetUrl?: string) {
  const profile = ensureProfile(walletAddress);
  const today = getUTCDateString();
  const already = taskCompletions.find(
    t => normalize(t.walletAddress) === normalize(walletAddress) && t.taskType === "daily_post" && t.completionDate === today && t.status === "active"
  );
  if (already) {
    return { success: false, message: "Daily post already completed" };
  }

  const bonusPoints = 100;
  taskCompletions.push({
    id: taskId++,
    walletAddress: profile.walletAddress,
    taskType: "daily_post",
    pointsAwarded: bonusPoints,
    completionDate: today,
    metadata: tweetUrl ? JSON.stringify({ tweetUrl }) : null,
    status: "active",
    completedAt: new Date(),
  });
  addPoints(walletAddress, bonusPoints, "daily_post", "Daily post completion");
  maybeClaimReferralBonus(walletAddress);
  return { success: true, message: `Earned ${bonusPoints} points for daily post!`, points: bonusPoints };
}

export function isDailyPostCompleted(walletAddress: string) {
  const today = getUTCDateString();
  return taskCompletions.some(
    t => normalize(t.walletAddress) === normalize(walletAddress) && t.taskType === "daily_post" && t.completionDate === today && t.status === "active"
  );
}

export function getDailyPostCompletions() {
  return taskCompletions.map(t => {
    let tweetUrl: string | null = null;
    if (t.metadata) {
      try {
        const parsed = JSON.parse(t.metadata);
        tweetUrl = parsed.tweetUrl || null;
      } catch {}
    }
    const profile = getWalletProfile(t.walletAddress);
    return {
      ...t,
      tweetUrl,
      xUsername: profile?.xUsername || null,
    };
  });
}

export function revokeTweetPoints(completionId: number) {
  const completion = taskCompletions.find(t => t.id === completionId);
  if (!completion) {
    return { success: false, message: "Completion not found" };
  }
  if (completion.status === "revoked") {
    return { success: false, message: "Already revoked" };
  }
  completion.status = "revoked";
  completion.revokedAt = new Date();
  addPoints(completion.walletAddress, -completion.pointsAwarded, "tweet_revoked", "Tweet revoked");
  return { success: true, message: "Tweet points revoked" };
}

export function getReferralStats(walletAddress: string) {
  const profile = ensureProfile(walletAddress);
  const walletReferrals = referrals.filter(r => normalize(r.referrerWallet) === normalize(walletAddress));
  const tier = getReferralTier(profile.referralCount);
  return {
    referralCode: profile.referralCode,
    referralCount: profile.referralCount,
    referralPointsEarned: profile.referralPointsEarned,
    referrals: walletReferrals,
    tier,
    canGenerateCode: profile.xConnected && profile.discordConnected && profile.discordVerified,
    referredBy: profile.referredBy,
  };
}

export function applyReferralCode(walletAddress: string, referralCode: string) {
  const profile = ensureProfile(walletAddress);
  if (profile.referredBy) {
    return { success: false, message: "Referral code already applied" };
  }
  const referrer = Array.from(profiles.values()).find(p => p.referralCode === referralCode.toUpperCase());
  if (!referrer) {
    return { success: false, message: "Referral code not found" };
  }
  if (normalize(referrer.walletAddress) === normalize(walletAddress)) {
    return { success: false, message: "You cannot refer yourself" };
  }
  profile.referredBy = referrer.walletAddress;
  touchProfile(profile);
  referrals.push({
    id: referralId++,
    referrerWallet: referrer.walletAddress,
    referredWallet: profile.walletAddress,
    referrerClaimed: false,
    referrerPoints: 0,
    referredPoints: 0,
    createdAt: new Date(),
  });
  updateReferralStats(referrer.walletAddress);
  return { success: true, message: "Referral code applied! Complete your first task to receive bonus points." };
}

export function claimReferralBonus(referredWallet: string) {
  const referral = referrals.find(r => normalize(r.referredWallet) === normalize(referredWallet));
  if (!referral) {
    return { success: false, message: "Referral not found" };
  }
  if (referral.referrerClaimed) {
    return { success: false, message: "Referral bonus already claimed" };
  }
  referral.referrerClaimed = true;
  referral.referrerPoints = 50;
  referral.referredPoints = 50;
  addPoints(referral.referrerWallet, 50, "referral_bonus", "Referral bonus");
  addPoints(referredWallet, 50, "referral_bonus", "Referral bonus");
  updateReferralStats(referral.referrerWallet);
  return { success: true, message: "Referral bonus claimed!", referrerPoints: 50, referredPoints: 50 };
}

export function getReferralLeaderboard(limit: number = 10) {
  const leaderboard = Array.from(profiles.values())
    .filter(p => p.referralCount > 0)
    .sort((a, b) => b.referralCount - a.referralCount)
    .slice(0, limit)
    .map((entry, index) => ({
      walletAddress: entry.walletAddress,
      referralCount: entry.referralCount,
      referralPointsEarned: entry.referralPointsEarned,
      rank: index + 1,
      tier: getReferralTier(entry.referralCount),
    }));
  return leaderboard;
}

export function getAdminStats() {
  const totalUsers = profiles.size;
  const totalPointsDistributed = Array.from(profiles.values()).reduce((sum, p) => sum + p.totalPoints, 0);
  const xConnectedUsers = Array.from(profiles.values()).filter(p => p.xConnected).length;
  const discordConnectedUsers = Array.from(profiles.values()).filter(p => p.discordConnected).length;
  const today = getUTCDateString();
  const dailyActiveUsers = new Set(
    taskCompletions.filter(t => t.completionDate === today).map(t => normalize(t.walletAddress))
  ).size;
  return {
    totalUsers,
    totalPointsDistributed,
    xConnectedUsers,
    discordConnectedUsers,
    dailyActiveUsers,
  };
}

export function adjustUserPoints(walletAddress: string, pointsChange: number, reason: string) {
  addPoints(walletAddress, pointsChange, "admin_adjustment", reason);
  const profile = getWalletProfile(walletAddress);
  return profile ? profile.totalPoints : 0;
}

export function getAllReferrals(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  return { referrals: referrals.slice(offset, offset + pageSize), total: referrals.length };
}

export function getAdminReferralStats() {
  const totalReferrals = referrals.length;
  const claimedReferrals = referrals.filter(r => r.referrerClaimed).length;
  const pendingReferrals = totalReferrals - claimedReferrals;
  const activeReferrers = new Set(referrals.map(r => normalize(r.referrerWallet))).size;

  const tierDistribution: Record<string, number> = {
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
    Diamond: 0,
  };

  profiles.forEach(profile => {
    const tier = getReferralTier(profile.referralCount).name;
    tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
  });

  return {
    totalReferrals,
    claimedReferrals,
    pendingReferrals,
    activeReferrers,
    tierDistribution,
  };
}

function buildDailySeries(days: number) {
  const series: Array<{ date: string; newUsers: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const dateStr = d.toISOString().split("T")[0];
    const newUsers = Array.from(profiles.values()).filter(p =>
      p.createdAt.toISOString().split("T")[0] === dateStr
    ).length;
    series.push({ date: dateStr, newUsers });
  }
  return series;
}

function buildDailyTasks(days: number) {
  const series: Array<{ date: string; completions: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const dateStr = d.toISOString().split("T")[0];
    const completions = taskCompletions.filter(t => t.completionDate === dateStr).length;
    series.push({ date: dateStr, completions });
  }
  return series;
}

function buildMonthlySeries(months: number) {
  const series: Array<{ month: string; newUsers: number }> = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const month = d.toISOString().slice(0, 7);
    const newUsers = Array.from(profiles.values()).filter(p =>
      p.createdAt.toISOString().slice(0, 7) === month
    ).length;
    series.push({ month, newUsers });
  }
  return series;
}

function buildMonthlyTasks(months: number) {
  const series: Array<{ month: string; completions: number }> = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const month = d.toISOString().slice(0, 7);
    const completions = taskCompletions.filter(t => t.completionDate.slice(0, 7) === month).length;
    series.push({ month, completions });
  }
  return series;
}

export function getActivityData() {
  return {
    daily: {
      users: buildDailySeries(30),
      tasks: buildDailyTasks(30),
    },
    monthly: {
      users: buildMonthlySeries(12),
      tasks: buildMonthlyTasks(12),
    },
    allTime: {
      totalUsers: profiles.size,
      totalTaskCompletions: taskCompletions.length,
    },
  };
}

export function checkAndRevokeDeletedTweets(_walletAddress?: string) {
  return { revoked: 0, checked: 0 };
}

export function cronCheckAllTweets() {
  return { totalChecked: 0, totalRevoked: 0, errors: 0 };
}
