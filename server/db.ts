import { eq, and, desc, sql, gte, lte, isNotNull } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import { 
  InsertUser, 
  users, 
  walletProfiles, 
  taskCompletions, 
  pointsHistory,
  referrals,
  InsertWalletProfile,
  InsertTaskCompletion,
  InsertPointsHistory
} from "../drizzle/schema";

let _db: MySql2Database | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance for MySQL/TiDB
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Connecting to database...");
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      _db = drizzle(_pool);
      // Test connection
      const conn = await _pool.getConnection();
      console.log("[Database] Connected successfully");
      conn.release();
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Get admin wallet address from environment
function getAdminWalletAddress(): string | undefined {
  return process.env.ADMIN_WALLET_ADDRESS;
}

export async function upsertUserByWallet(walletAddress: string, name?: string): Promise<void> {
  if (!walletAddress) {
    throw new Error("Wallet address is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const existing = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
  
  if (existing.length > 0) {
    await db.update(users)
      .set({ 
        lastSignedIn: new Date(),
        updatedAt: new Date(),
        ...(name ? { name } : {})
      })
      .where(eq(users.walletAddress, walletAddress));
  } else {
    // Check if this is the admin wallet
    const adminWallet = getAdminWalletAddress();
    const isAdmin = adminWallet && walletAddress.toLowerCase() === adminWallet.toLowerCase();
    
    await db.insert(users).values({
      walletAddress,
      name: name || null,
      role: isAdmin ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
  }
}

export async function getUserByWallet(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
  return result[0] || null;
}

// ============================================
// Wallet Profile Functions (Rewards System)
// ============================================

export async function getOrCreateWalletProfile(walletAddress: string, chainType: string = "evm") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get/create wallet profile: database not available");
    return null;
  }

  const existing = await db.select().from(walletProfiles).where(eq(walletProfiles.walletAddress, walletAddress)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create new profile without referral code
  // Referral code will be generated when X + Discord are both connected
  await db.insert(walletProfiles).values({
    walletAddress,
    chainType,
    totalPoints: 0,
    connectBonusClaimed: false,
    xConnected: false,
    discordConnected: false,
    referralCount: 0,
    referralPointsEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newProfile = await db.select().from(walletProfiles).where(eq(walletProfiles.walletAddress, walletAddress)).limit(1);
  return newProfile[0] || null;
}

export async function getWalletProfile(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(walletProfiles).where(eq(walletProfiles.walletAddress, walletAddress)).limit(1);
  return result[0] || null;
}

export async function updateWalletProfile(walletAddress: string, updates: Partial<InsertWalletProfile>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(walletProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  return getWalletProfile(walletAddress);
}

// ============================================
// Points Functions
// ============================================

export async function addPoints(
  walletAddress: string, 
  points: number, 
  transactionType: string,
  description?: string
) {
  const db = await getDb();
  if (!db) return null;

  // Get current profile
  const profile = await getWalletProfile(walletAddress);
  if (!profile) return null;

  const newTotal = profile.totalPoints + points;

  // Update total points
  await db.update(walletProfiles)
    .set({ totalPoints: newTotal, updatedAt: new Date() })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  // Record in points history
  await db.insert(pointsHistory).values({
    walletAddress,
    transactionType,
    pointsChange: points,
    balanceAfter: newTotal,
    description,
    createdAt: new Date(),
  });

  return newTotal;
}

/**
 * Look up the original bonus points awarded for a specific transaction type.
 * Returns the positive amount that was originally awarded, so we can deduct the exact same amount.
 * Falls back to the provided default if no history record is found.
 */
async function getOriginalBonusPoints(
  walletAddress: string,
  transactionType: string,
  fallback: number
): Promise<number> {
  const db = await getDb();
  if (!db) return fallback;

  const [record] = await db.select({ pointsChange: pointsHistory.pointsChange })
    .from(pointsHistory)
    .where(
      and(
        eq(pointsHistory.walletAddress, walletAddress),
        eq(pointsHistory.transactionType, transactionType)
      )
    )
    .orderBy(desc(pointsHistory.createdAt))
    .limit(1);

  if (record && record.pointsChange > 0) {
    return record.pointsChange;
  }
  return fallback;
}

// ============================================
// Task Completion Functions
// ============================================

export async function hasCompletedTask(walletAddress: string, taskType: string, date?: string) {
  const db = await getDb();
  if (!db) return false;

  let query = db.select().from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.walletAddress, walletAddress),
        eq(taskCompletions.taskType, taskType),
        eq(taskCompletions.status, "active")
      )
    );

  if (date) {
    query = db.select().from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.walletAddress, walletAddress),
          eq(taskCompletions.taskType, taskType),
          eq(taskCompletions.completionDate, date),
          eq(taskCompletions.status, "active")
        )
      );
  }

  const result = await query.limit(1);
  return result.length > 0;
}

export async function completeTask(
  walletAddress: string, 
  taskType: string, 
  pointsAwarded: number,
  metadata?: string,
  completionDate?: string
) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(taskCompletions).values({
    walletAddress,
    taskType,
    pointsAwarded,
    metadata,
    completionDate,
    completedAt: new Date(),
  });

  return true;
}

// ============================================
// Connect Bonus Functions
// ============================================

export async function claimConnectBonus(walletAddress: string): Promise<{ success: boolean; message: string; points?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (profile.connectBonusClaimed) {
    return { success: false, message: "Connect bonus already claimed" };
  }

  const bonusPoints = 300;

  // Mark as claimed and add points
  await db.update(walletProfiles)
    .set({ connectBonusClaimed: true, updatedAt: new Date() })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  await addPoints(walletAddress, bonusPoints, "connect_bonus", "Wallet connection bonus");

  return { success: true, message: `Earned ${bonusPoints} points for connecting wallet!`, points: bonusPoints };
}

// ============================================
// Social Connection Functions
// ============================================

// Helper function to auto-claim referral bonus when a referred user completes any task
async function maybeClaimReferralBonus(walletAddress: string) {
  const db = await getDb();
  if (!db) return;

  const profile = await getWalletProfile(walletAddress);
  if (!profile || !profile.referredBy) return;

  // Check if bonus already claimed
  const referral = await db.select().from(referrals)
    .where(eq(referrals.referredWallet, walletAddress))
    .limit(1);

  if (referral.length > 0 && !referral[0].referrerClaimed) {
    console.log(`[Referral] Auto-claiming bonus for referred wallet ${walletAddress}`);
    await claimReferralBonus(walletAddress);
  }
}

// Helper function to generate referral code when conditions are met
async function maybeGenerateReferralCode(walletAddress: string) {
  const db = await getDb();
  if (!db) return;

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return;

  // Check if X connected, Discord connected, and Discord verified, and no referral code exists yet
  if (profile.xConnected && profile.discordConnected && profile.discordVerified && !profile.referralCode) {
    const referralCode = nanoid(8).toUpperCase();
    await db.update(walletProfiles)
      .set({ referralCode, updatedAt: new Date() })
      .where(eq(walletProfiles.walletAddress, walletAddress));
    console.log(`[Referral] Generated code ${referralCode} for wallet ${walletAddress}`);
  }
}

export async function connectXAccount(walletAddress: string, xUsername: string): Promise<{ success: boolean; message: string; points?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (profile.xConnected) {
    return { success: false, message: "X account already connected" };
  }

  const bonusPoints = 100;

  await db.update(walletProfiles)
    .set({ 
      xConnected: true, 
      xUsername,
      xConnectedAt: new Date(),
      updatedAt: new Date() 
    })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  await addPoints(walletAddress, bonusPoints, "x_connect", `Connected X account: @${xUsername}`);

  // Check if referral code should be generated
  await maybeGenerateReferralCode(walletAddress);

  // Auto-claim referral bonus if applicable
  await maybeClaimReferralBonus(walletAddress);

  return { success: true, message: `Earned ${bonusPoints} points for connecting X!`, points: bonusPoints };
}

export async function disconnectXAccount(walletAddress: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (!profile.xConnected) {
    return { success: false, message: "X account not connected" };
  }

  await db.update(walletProfiles)
    .set({ 
      xConnected: false, 
      xUsername: null,
      xConnectedAt: null,
      updatedAt: new Date() 
    })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  // Deduct the exact amount that was originally awarded
  const originalBonus = await getOriginalBonusPoints(walletAddress, "x_connect", 100);
  await addPoints(walletAddress, -originalBonus, "x_disconnect", `Disconnected X account (-${originalBonus}pt)`);

  return { success: true, message: `X account disconnected. ${originalBonus} points deducted.` };
}

export async function connectDiscordAccount(walletAddress: string, discordUsername: string, discordId?: string): Promise<{ success: boolean; message: string; points?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (profile.discordConnected) {
    return { success: false, message: "Discord account already connected" };
  }

  const bonusPoints = 50;

  await db.update(walletProfiles)
    .set({ 
      discordConnected: true, 
      discordUsername,
      discordId: discordId || null,
      discordConnectedAt: new Date(),
      updatedAt: new Date() 
    })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  await addPoints(walletAddress, bonusPoints, "discord_connect", `Connected Discord: ${discordUsername}`);

  // Check if referral code should be generated
  await maybeGenerateReferralCode(walletAddress);

  // Auto-claim referral bonus if applicable
  await maybeClaimReferralBonus(walletAddress);

  return { success: true, message: `Earned ${bonusPoints} points for connecting Discord!`, points: bonusPoints };
}

export async function disconnectDiscordAccount(walletAddress: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (!profile.discordConnected) {
    return { success: false, message: "Discord account not connected" };
  }

  const wasVerified = profile.discordVerified;

  // Reset all Discord-related fields including verify status
  await db.update(walletProfiles)
    .set({ 
      discordConnected: false, 
      discordUsername: null,
      discordId: null,
      discordConnectedAt: null,
      discordVerified: false,
      discordVerifiedAt: null,
      updatedAt: new Date() 
    })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  // Deduct the exact amount that was originally awarded for connection
  const connectBonus = await getOriginalBonusPoints(walletAddress, "discord_connect", 50);
  await addPoints(walletAddress, -connectBonus, "discord_disconnect", `Disconnected Discord account (-${connectBonus}pt)`);

  let totalDeducted = connectBonus;

  // If was verified, also deduct the exact verify bonus
  if (wasVerified) {
    const verifyBonus = await getOriginalBonusPoints(walletAddress, "discord_verify", 50);
    await addPoints(walletAddress, -verifyBonus, "discord_verify_revoked", `Discord server verification revoked (-${verifyBonus}pt)`);
    totalDeducted += verifyBonus;
  }

  return { success: true, message: `Discord account disconnected. ${totalDeducted} points deducted.` };
}

// ============================================
// Daily Post Functions
// ============================================

export async function completeDailyPost(walletAddress: string, tweetUrl?: string): Promise<{ success: boolean; message: string; points?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (!profile.xConnected) {
    return { success: false, message: "X account must be connected first" };
  }

  // Check if already completed today (UTC)
  const today = new Date().toISOString().split('T')[0];
  const alreadyCompleted = await hasCompletedTask(walletAddress, "daily_post", today);
  
  if (alreadyCompleted) {
    return { success: false, message: "Daily post already completed today. Try again tomorrow!" };
  }

  const bonusPoints = 100;

  // Record task completion
  await completeTask(walletAddress, "daily_post", bonusPoints, tweetUrl, today);
  await addPoints(walletAddress, bonusPoints, "daily_post", `Daily X post: ${tweetUrl || 'completed'}`);

  // Check if this is the first task completion for a referred user
  // If so, trigger the referral bonus
  if (profile.referredBy) {
    const referral = await db.select().from(referrals)
      .where(eq(referrals.referredWallet, walletAddress))
      .limit(1);
    
    if (referral.length > 0 && !referral[0].referrerClaimed) {
      // This is the first task completion - trigger referral bonus
      await claimReferralBonus(walletAddress);
    }
  }

  return { success: true, message: `Earned ${bonusPoints} points for daily post!`, points: bonusPoints };
}

// ============================================
// Referral Functions
// ============================================

export async function getOrCreateReferralCode(walletAddress: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return null;

  // Check if X connected, Discord connected, and Discord verified
  if (!profile.xConnected || !profile.discordConnected || !profile.discordVerified) {
    return null; // Cannot generate code until all conditions are met
  }

  if (profile.referralCode) {
    return profile.referralCode;
  }

  // Generate new referral code
  const referralCode = nanoid(8).toUpperCase();
  await db.update(walletProfiles)
    .set({ referralCode, updatedAt: new Date() })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  return referralCode;
}

export async function applyReferralCode(walletAddress: string, referralCode: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  // Check if already referred
  if (profile.referredBy) {
    return { success: false, message: "You have already used a referral code" };
  }

  // Find the referrer by code
  const referrerProfiles = await db.select().from(walletProfiles)
    .where(eq(walletProfiles.referralCode, referralCode.toUpperCase()))
    .limit(1);

  if (referrerProfiles.length === 0) {
    return { success: false, message: "Invalid referral code" };
  }

  const referrer = referrerProfiles[0];

  // Cannot refer yourself
  if (referrer.walletAddress === walletAddress) {
    return { success: false, message: "You cannot use your own referral code" };
  }

  // Referrer must have all conditions met (X connected + Discord connected + Discord verified)
  if (!referrer.xConnected || !referrer.discordConnected || !referrer.discordVerified) {
    return { success: false, message: "This referral code is currently inactive" };
  }

  // Record the referral relationship
  await db.insert(referrals).values({
    referrerWallet: referrer.walletAddress,
    referredWallet: walletAddress,
    referralCode: referralCode.toUpperCase(),
    referrerPoints: 0,
    referredPoints: 0,
    referrerClaimed: false,
    referredClaimed: false,
  });

  // Update the referred user's profile
  await db.update(walletProfiles)
    .set({ referredBy: referralCode.toUpperCase(), updatedAt: new Date() })
    .where(eq(walletProfiles.walletAddress, walletAddress));

  console.log(`[Referral] Code ${referralCode.toUpperCase()} applied: referrer=${referrer.walletAddress}, referred=${walletAddress}`);

  return { success: true, message: "Referral code applied! Complete your first task to receive bonus points." };
}

export async function claimReferralBonus(referredWallet: string): Promise<{ success: boolean; message: string; referrerPoints?: number; referredPoints?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  // Find the referral record
  const referralRecords = await db.select().from(referrals)
    .where(eq(referrals.referredWallet, referredWallet))
    .limit(1);

  if (referralRecords.length === 0) {
    return { success: false, message: "No referral found for this wallet" };
  }

  const referral = referralRecords[0];

  if (referral.referrerClaimed) {
    return { success: false, message: "Referral bonus already claimed" };
  }

  // New spec: Both referrer and referred get 50 points
  const referrerBonus = 50;
  const referredBonus = 50;

  // Award points to referrer
  await addPoints(referral.referrerWallet, referrerBonus, "referral_bonus", `Referral bonus for inviting ${referredWallet.slice(0, 8)}...`);

  // Award points to referred user
  await addPoints(referredWallet, referredBonus, "referral_bonus", "Welcome bonus for using referral code");

  // Update referrer's stats
  const referrerProfile = await getWalletProfile(referral.referrerWallet);
  if (referrerProfile) {
    await db.update(walletProfiles)
      .set({ 
        referralCount: referrerProfile.referralCount + 1,
        referralPointsEarned: referrerProfile.referralPointsEarned + referrerBonus,
        updatedAt: new Date() 
      })
      .where(eq(walletProfiles.walletAddress, referral.referrerWallet));
  }

  // Mark referral as claimed
  await db.update(referrals)
    .set({ 
      referrerClaimed: true, 
      referredClaimed: true,
      claimedAt: new Date(),
      referrerPoints: referrerBonus,
      referredPoints: referredBonus
    })
    .where(eq(referrals.id, referral.id));

  console.log(`[Referral] Bonus claimed: referrer=${referral.referrerWallet} (+${referrerBonus}), referred=${referredWallet} (+${referredBonus})`);

  return { 
    success: true, 
    message: "Referral bonus claimed!", 
    referrerPoints: referrerBonus,
    referredPoints: referredBonus
  };
}

export async function getReferralStats(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return null;

  // Get referral details
  const referralsList = await db.select().from(referrals)
    .where(eq(referrals.referrerWallet, walletAddress))
    .orderBy(desc(referrals.createdAt));

  // Calculate tier based on referral count
  const tierInfo = calculateTier(profile.referralCount);

  return {
    referralCode: profile.referralCode,
    referralCount: profile.referralCount,
    referralPointsEarned: profile.referralPointsEarned,
    referrals: referralsList,
    tier: tierInfo,
    canGenerateCode: profile.xConnected && profile.discordConnected && profile.discordVerified,
    referredBy: profile.referredBy,
  };
}

// Helper function to calculate tier
function calculateTier(referralCount: number) {
  const tiers = [
    { name: "Diamond", minReferrals: 100, bonusPerReferral: 100, percentageBonus: 15, color: "#b9f2ff" },
    { name: "Platinum", minReferrals: 50, bonusPerReferral: 75, percentageBonus: 12, color: "#e5e4e2" },
    { name: "Gold", minReferrals: 25, bonusPerReferral: 60, percentageBonus: 10, color: "#ffd700" },
    { name: "Silver", minReferrals: 10, bonusPerReferral: 55, percentageBonus: 8, color: "#c0c0c0" },
    { name: "Bronze", minReferrals: 0, bonusPerReferral: 50, percentageBonus: 5, color: "#cd7f32" },
  ];

  for (const tier of tiers) {
    if (referralCount >= tier.minReferrals) {
      return tier;
    }
  }

  return tiers[tiers.length - 1]; // Default to Bronze
}

export async function getReferralLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const leaderboard = await db.select({
    walletAddress: walletProfiles.walletAddress,
    referralCount: walletProfiles.referralCount,
    referralPointsEarned: walletProfiles.referralPointsEarned,
  })
    .from(walletProfiles)
    .where(gte(walletProfiles.referralCount, 1))
    .orderBy(desc(walletProfiles.referralCount))
    .limit(limit);

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    tier: calculateTier(entry.referralCount),
  }));
}

// ============================================
// Admin Functions
// ============================================

export async function getAllWalletProfiles(page: number = 1, pageSize: number = 20) {
  const db = await getDb();
  if (!db) return { profiles: [], total: 0 };

  const offset = (page - 1) * pageSize;

  const profiles = await db.select().from(walletProfiles)
    .orderBy(desc(walletProfiles.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles);
  const total = countResult[0]?.count || 0;

  return { profiles, total };
}

export async function getPointsHistory(walletAddress?: string, page: number = 1, pageSize: number = 20) {
  const db = await getDb();
  if (!db) return { history: [], total: 0 };

  const offset = (page - 1) * pageSize;

  let history;
  let total = 0;
  
  if (walletAddress) {
    history = await db.select().from(pointsHistory)
      .where(eq(pointsHistory.walletAddress, walletAddress))
      .orderBy(desc(pointsHistory.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(pointsHistory)
      .where(eq(pointsHistory.walletAddress, walletAddress));
    total = countResult[0]?.count || 0;
  } else {
    history = await db.select().from(pointsHistory)
      .orderBy(desc(pointsHistory.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(pointsHistory);
    total = countResult[0]?.count || 0;
  }

  return { history, total };
}

export async function getRewardsStats() {
  const db = await getDb();
  if (!db) return null;

  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles);
  const totalPointsResult = await db.select({ sum: sql<number>`COALESCE(SUM(total_points), 0)` }).from(walletProfiles);
  const xConnectedResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles).where(eq(walletProfiles.xConnected, true));
  const discordConnectedResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles).where(eq(walletProfiles.discordConnected, true));

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    totalPointsDistributed: totalPointsResult[0]?.sum || 0,
    xConnectedUsers: xConnectedResult[0]?.count || 0,
    discordConnectedUsers: discordConnectedResult[0]?.count || 0,
  };
}

export async function getAllReferrals(page: number = 1, pageSize: number = 20) {
  const db = await getDb();
  if (!db) return { referrals: [], total: 0 };

  const offset = (page - 1) * pageSize;

  const referralsList = await db.select().from(referrals)
    .orderBy(desc(referrals.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(referrals);
  const total = countResult[0]?.count || 0;

  return { referrals: referralsList, total };
}

export async function getReferralAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const totalReferralsResult = await db.select({ count: sql<number>`count(*)` }).from(referrals);
  const claimedReferralsResult = await db.select({ count: sql<number>`count(*)` }).from(referrals).where(eq(referrals.referrerClaimed, true));
  const totalPointsResult = await db.select({ 
    referrerSum: sql<number>`COALESCE(SUM(referrer_points), 0)`,
    referredSum: sql<number>`COALESCE(SUM(referred_points), 0)`
  }).from(referrals);
  
  const activeReferrersResult = await db.select({ count: sql<number>`count(DISTINCT referrer_wallet)` }).from(referrals);

  // Get tier distribution
  const profiles = await db.select({
    referralCount: walletProfiles.referralCount
  }).from(walletProfiles).where(gte(walletProfiles.referralCount, 1));

  const tierDistribution = {
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
    Diamond: 0,
  };

  for (const p of profiles) {
    const tier = calculateTier(p.referralCount);
    tierDistribution[tier.name as keyof typeof tierDistribution]++;
  }

  return {
    totalReferrals: totalReferralsResult[0]?.count || 0,
    claimedReferrals: claimedReferralsResult[0]?.count || 0,
    pendingReferrals: Math.max(0, (totalReferralsResult[0]?.count || 0) - (claimedReferralsResult[0]?.count || 0)),
    activeReferrers: activeReferrersResult[0]?.count || 0,
    tierDistribution,
  };
}


// ============================================
// Additional Helper Functions
// ============================================

export function getUTCDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function isDailyPostCompleted(walletAddress: string): Promise<boolean> {
  const today = getUTCDateString();
  return hasCompletedTask(walletAddress, "daily_post", today);
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles);
  const totalPointsResult = await db.select({ sum: sql<number>`COALESCE(SUM(total_points), 0)` }).from(walletProfiles);
  const xConnectedResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles).where(eq(walletProfiles.xConnected, true));
  const discordConnectedResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles).where(eq(walletProfiles.discordConnected, true));
  
  // Get today's active users (completed daily post)
  const today = getUTCDateString();
  const dailyActiveResult = await db.select({ count: sql<number>`count(DISTINCT wallet_address)` })
    .from(taskCompletions)
    .where(eq(taskCompletions.completionDate, today));

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    totalPointsDistributed: totalPointsResult[0]?.sum || 0,
    xConnectedUsers: xConnectedResult[0]?.count || 0,
    discordConnectedUsers: discordConnectedResult[0]?.count || 0,
    dailyActiveUsers: dailyActiveResult[0]?.count || 0,
  };
}

export async function searchWalletProfiles(query: string, page: number = 1, pageSize: number = 20) {
  const db = await getDb();
  if (!db) return { profiles: [], total: 0 };

  const offset = (page - 1) * pageSize;
  const searchPattern = `%${query}%`;

  const profiles = await db.select().from(walletProfiles)
    .where(sql`wallet_address LIKE ${searchPattern} OR x_username LIKE ${searchPattern} OR discord_username LIKE ${searchPattern}`)
    .orderBy(desc(walletProfiles.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(walletProfiles)
    .where(sql`wallet_address LIKE ${searchPattern} OR x_username LIKE ${searchPattern} OR discord_username LIKE ${searchPattern}`);
  const total = countResult[0]?.count || 0;

  return { profiles, total };
}

export async function adjustUserPoints(
  walletAddress: string, 
  pointsChange: number, 
  reason: string
): Promise<{ success: boolean; message: string; newTotal?: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  const newTotal = await addPoints(walletAddress, pointsChange, "admin_adjustment", reason);

  return { 
    success: true, 
    message: `Points adjusted by ${pointsChange >= 0 ? '+' : ''}${pointsChange}`, 
    newTotal: newTotal || 0 
  };
}

export async function getDailyPostCompletions(date?: string) {
  const db = await getDb();
  if (!db) return [];

  // If no date specified, get all daily posts (not just today)
  const conditions = [eq(taskCompletions.taskType, "daily_post")];
  if (date) {
    conditions.push(eq(taskCompletions.completionDate, date));
  }

  const completions = await db.select({
    id: taskCompletions.id,
    walletAddress: taskCompletions.walletAddress,
    taskType: taskCompletions.taskType,
    pointsAwarded: taskCompletions.pointsAwarded,
    completionDate: taskCompletions.completionDate,
    metadata: taskCompletions.metadata,
    status: taskCompletions.status,
    completedAt: taskCompletions.completedAt,
    revokedAt: taskCompletions.revokedAt,
    xUsername: walletProfiles.xUsername,
  })
    .from(taskCompletions)
    .leftJoin(walletProfiles, eq(taskCompletions.walletAddress, walletProfiles.walletAddress))
    .where(and(...conditions))
    .orderBy(desc(taskCompletions.completedAt));

  // Parse metadata to extract tweetUrl
  return completions.map(c => {
    let tweetUrl = null;
    try {
      if (c.metadata) {
        const meta = JSON.parse(c.metadata);
        tweetUrl = meta.tweetUrl || null;
      }
    } catch {}
    return { ...c, tweetUrl };
  });
}

/**
 * Revoke points for a deleted tweet
 * Marks the task completion as revoked and deducts points from the user
 */
export async function revokeTweetPoints(
  completionId: number
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  // Get the task completion
  const completion = await db.select().from(taskCompletions)
    .where(eq(taskCompletions.id, completionId))
    .limit(1);

  if (completion.length === 0) {
    return { success: false, message: "Task completion not found" };
  }

  const task = completion[0];

  if (task.status === "revoked") {
    return { success: false, message: "Already revoked" };
  }

  // Mark as revoked
  await db.update(taskCompletions)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(eq(taskCompletions.id, completionId));

  // Deduct points from user
  const pointsToDeduct = -task.pointsAwarded;
  await addPoints(
    task.walletAddress,
    pointsToDeduct,
    "tweet_revoked",
    `Points revoked for deleted tweet (completion #${completionId})`
  );

  return { success: true, message: `Revoked ${task.pointsAwarded} points from ${task.walletAddress}` };
}

export async function getUserActivityStats(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return null;

  // Get total task completions
  const taskCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(taskCompletions)
    .where(eq(taskCompletions.walletAddress, walletAddress));

  // Get daily post streak (simplified - just count recent days)
  const recentPosts = await db.select()
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.walletAddress, walletAddress),
        eq(taskCompletions.taskType, "daily_post")
      )
    )
    .orderBy(desc(taskCompletions.completedAt))
    .limit(30);

  return {
    totalTasks: taskCountResult[0]?.count || 0,
    recentDailyPosts: recentPosts.length,
    profile,
  };
}

export function getReferralTier(referralCount: number) {
  const tiers = [
    { name: "Diamond", minReferrals: 100, bonusPerReferral: 100, percentageBonus: 15, color: "#b9f2ff" },
    { name: "Platinum", minReferrals: 50, bonusPerReferral: 75, percentageBonus: 12, color: "#e5e4e2" },
    { name: "Gold", minReferrals: 25, bonusPerReferral: 60, percentageBonus: 10, color: "#ffd700" },
    { name: "Silver", minReferrals: 10, bonusPerReferral: 55, percentageBonus: 8, color: "#c0c0c0" },
    { name: "Bronze", minReferrals: 0, bonusPerReferral: 50, percentageBonus: 5, color: "#cd7f32" },
  ];

  for (const tier of tiers) {
    if (referralCount >= tier.minReferrals) {
      return tier;
    }
  }

  return tiers[tiers.length - 1];
}

export async function getAdminReferralStats() {
  return getReferralAdminStats();
}


// Get activity data for admin dashboard charts
export async function getActivityData() {
  const db = await getDb();
  if (!db) {
    return {
      daily: {
        users: [],
        tasks: []
      },
      monthly: {
        users: [],
        tasks: []
      },
      allTime: {
        totalUsers: 0,
        totalTaskCompletions: 0
      }
    };
  }

  try {
    // Get daily user registrations (last 30 days)
    const dailyUsersResult = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as newUsers
      FROM wallet_profiles
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get daily task completions (last 30 days)
    const dailyTasksResult = await db.execute(sql`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completions
      FROM task_completions
      WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `);

    // Get monthly user registrations (last 12 months)
    const monthlyUsersResult = await db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as newUsers
      FROM wallet_profiles
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Get monthly task completions (last 12 months)
    const monthlyTasksResult = await db.execute(sql`
      SELECT 
        DATE_FORMAT(completed_at, '%Y-%m') as month,
        COUNT(*) as completions
      FROM task_completions
      WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(completed_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Get all-time totals
    const totalUsersResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM wallet_profiles
    `);

    const totalTasksResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM task_completions
    `);

    const dailyUsers = (dailyUsersResult[0] as unknown as any[]).map((row: any) => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      newUsers: Number(row.newUsers) || 0
    }));

    const dailyTasks = (dailyTasksResult[0] as unknown as any[]).map((row: any) => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
      completions: Number(row.completions) || 0
    }));

    const monthlyUsers = (monthlyUsersResult[0] as unknown as any[]).map((row: any) => ({
      month: row.month || '',
      newUsers: Number(row.newUsers) || 0
    }));

    const monthlyTasks = (monthlyTasksResult[0] as unknown as any[]).map((row: any) => ({
      month: row.month || '',
      completions: Number(row.completions) || 0
    }));

    const totalUsers = Number((totalUsersResult[0] as unknown as any[])[0]?.total) || 0;
    const totalTasks = Number((totalTasksResult[0] as unknown as any[])[0]?.total) || 0;

    return {
      daily: {
        users: dailyUsers,
        tasks: dailyTasks
      },
      monthly: {
        users: monthlyUsers,
        tasks: monthlyTasks
      },
      allTime: {
        totalUsers,
        totalTaskCompletions: totalTasks
      }
    };
  } catch (error) {
    console.error("[getActivityData] Error:", error);
    return {
      daily: {
        users: [],
        tasks: []
      },
      monthly: {
        users: [],
        tasks: []
      },
      allTime: {
        totalUsers: 0,
        totalTaskCompletions: 0
      }
    };
  }
}


// ============================================
// Discord Server Verification
// ============================================

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";

/**
 * Verify that a user has joined the PerpX Discord server
 * Uses Discord Bot API to check guild membership
 */
export const DISCORD_INVITE_URL = "https://discord.gg/5BUJrR3JnK";

export async function verifyDiscordServer(walletAddress: string): Promise<{ success: boolean; message: string; points?: number; notJoined?: boolean; inviteUrl?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return { success: false, message: "Discord verification not configured" };
  }

  const profile = await getWalletProfile(walletAddress);
  if (!profile) return { success: false, message: "Profile not found" };

  if (!profile.discordConnected) {
    return { success: false, message: "Discord account must be connected first" };
  }

  if (profile.discordVerified) {
    return { success: false, message: "Discord server already verified" };
  }

  if (!profile.discordId) {
    return { success: false, message: "Discord ID not found. Please reconnect your Discord account." };
  }

  try {
    // Check if user is a member of the guild using Discord Bot API
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${profile.discordId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.status === 404) {
      return { success: false, message: "You are not a member of the PerpX Discord server. Please join first and then try again.", notJoined: true, inviteUrl: DISCORD_INVITE_URL };
    }

    if (!response.ok) {
      console.error("[Discord Verify] API error:", response.status, await response.text());
      return { success: false, message: "Failed to verify Discord membership. Please try again later." };
    }

    // User is a member - mark as verified and award points
    const bonusPoints = 50;

    await db.update(walletProfiles)
      .set({
        discordVerified: true,
        discordVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(walletProfiles.walletAddress, walletAddress));

    await addPoints(walletAddress, bonusPoints, "discord_verify", "Verified PerpX Discord server membership");

    // Check if referral code should be generated (now that Discord is verified)
    await maybeGenerateReferralCode(walletAddress);

    // Auto-claim referral bonus if applicable
    await maybeClaimReferralBonus(walletAddress);

    return { success: true, message: `Earned ${bonusPoints} points for verifying Discord server membership!`, points: bonusPoints };
  } catch (error) {
    console.error("[Discord Verify] Error:", error);
    return { success: false, message: "Failed to verify Discord membership. Please try again later." };
  }
}

// ============================================
// Background Discord Server Membership Check
// ============================================

/**
 * Check a single user's Discord server membership status.
 * Called when Rewards page loads (getProfile). If user has left the server,
 * revoke verify status and deduct 50pt.
 * Returns true if still in server (or not verified), false if revoked.
 */
export async function checkUserDiscordMembership(walletAddress: string): Promise<{ stillMember: boolean; revoked: boolean }> {
  const db = await getDb();
  if (!db) return { stillMember: true, revoked: false };

  const [profile] = await db.select()
    .from(walletProfiles)
    .where(eq(walletProfiles.walletAddress, walletAddress))
    .limit(1);

  // If not verified or no discordId, nothing to check
  if (!profile || !profile.discordVerified || !profile.discordId) {
    return { stillMember: true, revoked: false };
  }

  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return { stillMember: true, revoked: false };
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${profile.discordId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.status === 404) {
      // User has left the server - revoke verify status and deduct 50pt
      console.log(`[Discord Check] User ${walletAddress} has left the server. Revoking verification.`);

      await db.update(walletProfiles)
        .set({
          discordVerified: false,
          discordVerifiedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(walletProfiles.walletAddress, walletAddress));

      const verifyBonus = await getOriginalBonusPoints(walletAddress, "discord_verify", 50);
      await addPoints(walletAddress, -verifyBonus, "discord_verify_revoked", `Discord server verification revoked - left server (-${verifyBonus}pt)`);

      return { stillMember: false, revoked: true };
    }

    if (response.ok) {
      return { stillMember: true, revoked: false };
    }

    // Other API errors - don't revoke, just log
    console.error(`[Discord Check] API error for ${walletAddress}: ${response.status}`);
    return { stillMember: true, revoked: false };
  } catch (error) {
    console.error(`[Discord Check] Error checking ${walletAddress}:`, error);
    return { stillMember: true, revoked: false };
  }
}

/**
 * Check all verified users' Discord server membership status.
 * If a user has left the server, revoke their verify status and deduct 50pt.
 */
export async function checkDiscordServerMemberships(): Promise<{ checked: number; revoked: number; errors: number }> {
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.warn("[Discord Membership Check] Bot token or guild ID not configured, skipping.");
    return { checked: 0, revoked: 0, errors: 0 };
  }

  const db = await getDb();
  if (!db) {
    console.error("[Discord Membership Check] Database not available.");
    return { checked: 0, revoked: 0, errors: 0 };
  }

  // Get all users who are Discord verified and have a discordId
  const verifiedUsers = await db.select({
    walletAddress: walletProfiles.walletAddress,
    discordId: walletProfiles.discordId,
    discordUsername: walletProfiles.discordUsername,
  })
    .from(walletProfiles)
    .where(
      and(
        eq(walletProfiles.discordVerified, true),
        isNotNull(walletProfiles.discordId),
      )
    );

  let checked = 0;
  let revoked = 0;
  let errors = 0;

  for (const user of verifiedUsers) {
    if (!user.discordId) continue;

    try {
      // Rate limit: Discord allows 50 requests per second for bot endpoints
      // Add a small delay between requests to be safe
      if (checked > 0 && checked % 40 === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${user.discordId}`,
        {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          },
        }
      );

      checked++;

      if (response.status === 404) {
        // User has left the server - revoke verify status and deduct points
        console.log(`[Discord Membership Check] User ${user.walletAddress} (${user.discordUsername}) has left the server. Revoking verification.`);

        await db.update(walletProfiles)
          .set({
            discordVerified: false,
            discordVerifiedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(walletProfiles.walletAddress, user.walletAddress));

        await addPoints(user.walletAddress, -50, "discord_verify_revoked", "Discord server verification revoked (left server)");

        revoked++;
      } else if (!response.ok) {
        console.error(`[Discord Membership Check] API error for ${user.walletAddress}: ${response.status}`);
        errors++;
      }
      // If response.ok (200), user is still in the server - no action needed
    } catch (error) {
      console.error(`[Discord Membership Check] Error checking ${user.walletAddress}:`, error);
      errors++;
    }
  }

  console.log(`[Discord Membership Check] Complete: checked=${checked}, revoked=${revoked}, errors=${errors}`);
  return { checked, revoked, errors };
}


// ============================================
// Tweet Existence Verification (oEmbed API)
// ============================================

/**
 * Check if a tweet still exists using Twitter's oEmbed API.
 * This API is free, requires no authentication, and has generous rate limits.
 * Returns true if the tweet exists, false if deleted/unavailable.
 */
export async function checkTweetExists(tweetUrl: string): Promise<boolean> {
  try {
    const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`;
    const response = await fetch(oEmbedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      return true; // Tweet exists
    }

    if (response.status === 404 || response.status === 403) {
      return false; // Tweet deleted or account suspended/private
    }

    // Other errors (rate limit, server error) - assume tweet exists to avoid false revocations
    console.warn(`[Tweet Check] Unexpected status ${response.status} for ${tweetUrl}`);
    return true;
  } catch (error) {
    // Network errors - assume tweet exists to avoid false revocations
    console.error(`[Tweet Check] Error checking ${tweetUrl}:`, error);
    return true;
  }
}

/**
 * Get all active daily_post task completions that have a tweet URL in metadata.
 * Used for both frontend-triggered checks and server-side cron jobs.
 */
export async function getActiveTweetCompletions(walletAddress?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(taskCompletions.taskType, "daily_post"),
    eq(taskCompletions.status, "active"),
    isNotNull(taskCompletions.metadata),
  ];

  if (walletAddress) {
    conditions.push(eq(taskCompletions.walletAddress, walletAddress));
  }

  const results = await db.select().from(taskCompletions)
    .where(and(...conditions))
    .orderBy(desc(taskCompletions.completedAt));

  // Filter out entries where metadata is empty or not a valid tweet URL
  return results.filter(r => r.metadata && r.metadata.startsWith("http"));
}

/**
 * Check all active tweets for a specific wallet and revoke points for deleted ones.
 * Called from frontend when user visits Rewards page.
 * Returns list of revoked completion IDs.
 */
export async function checkAndRevokeDeletedTweets(walletAddress: string): Promise<{
  checked: number;
  revoked: number;
  revokedIds: number[];
}> {
  const completions = await getActiveTweetCompletions(walletAddress);
  
  let checked = 0;
  let revoked = 0;
  const revokedIds: number[] = [];

  for (const completion of completions) {
    if (!completion.metadata) continue;

    checked++;
    const exists = await checkTweetExists(completion.metadata);

    if (!exists) {
      // Tweet has been deleted - revoke points
      const result = await revokeTweetPoints(completion.id);
      if (result.success) {
        revoked++;
        revokedIds.push(completion.id);
        console.log(`[Tweet Check] Revoked points for deleted tweet: ${completion.metadata} (wallet: ${walletAddress}, completion: ${completion.id})`);
      }
    }

    // Small delay between requests to avoid rate limiting
    if (checked % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { checked, revoked, revokedIds };
}

/**
 * Server-side cron job: Check ALL active tweets across all users.
 * Runs at UTC 00:00 daily. Processes in batches with rate limiting.
 * Returns summary of checks performed.
 */
export async function cronCheckAllTweets(): Promise<{
  totalChecked: number;
  totalRevoked: number;
  errors: number;
}> {
  console.log("[Cron Tweet Check] Starting daily tweet existence check...");

  const completions = await getActiveTweetCompletions();
  
  let totalChecked = 0;
  let totalRevoked = 0;
  let errors = 0;

  for (const completion of completions) {
    if (!completion.metadata) continue;

    try {
      totalChecked++;
      const exists = await checkTweetExists(completion.metadata);

      if (!exists) {
        const result = await revokeTweetPoints(completion.id);
        if (result.success) {
          totalRevoked++;
          console.log(`[Cron Tweet Check] Revoked: ${completion.metadata} (wallet: ${completion.walletAddress})`);
        }
      }

      // Rate limiting: 1 request per 200ms = ~5 per second (conservative for oEmbed)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Longer pause every 50 requests
      if (totalChecked % 50 === 0) {
        console.log(`[Cron Tweet Check] Progress: ${totalChecked}/${completions.length} checked, ${totalRevoked} revoked`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[Cron Tweet Check] Error checking completion ${completion.id}:`, error);
      errors++;
    }
  }

  console.log(`[Cron Tweet Check] Complete: checked=${totalChecked}, revoked=${totalRevoked}, errors=${errors}`);
  return { totalChecked, totalRevoked, errors };
}
