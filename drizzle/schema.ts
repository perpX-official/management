import { mysqlTable, serial, varchar, text, timestamp, boolean, int } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * 
 * Note: Using MySQL/TiDB compatible schema (no ENUMs, using varchar instead)
 */

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  /** Wallet address as primary identifier */
  walletAddress: varchar("wallet_address", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: varchar("role", { length: 16 }).default("user").notNull(), // 'user' | 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Wallet profiles - stores wallet addresses and their associated rewards data
 * This is the main table for the rewards system, keyed by wallet address
 */
export const walletProfiles = mysqlTable("wallet_profiles", {
  id: serial("id").primaryKey(),
  /** Wallet address (EVM, Tron, or Solana format) */
  walletAddress: varchar("wallet_address", { length: 128 }).notNull().unique(),
  /** Chain type: evm, tron, solana */
  chainType: varchar("chain_type", { length: 16 }).notNull(), // 'evm' | 'tron' | 'solana'
  /** Total accumulated points */
  totalPoints: int("total_points").default(0).notNull(),
  /** Whether the initial connect bonus has been claimed */
  connectBonusClaimed: boolean("connect_bonus_claimed").default(false).notNull(),
  /** X (Twitter) connection status */
  xConnected: boolean("x_connected").default(false).notNull(),
  xUsername: varchar("x_username", { length: 64 }),
  xConnectedAt: timestamp("x_connected_at"),
  /** Discord connection status */
  discordConnected: boolean("discord_connected").default(false).notNull(),
  discordUsername: varchar("discord_username", { length: 64 }),
  discordConnectedAt: timestamp("discord_connected_at"),
  /** Discord server verification status */
  discordId: varchar("discord_id", { length: 64 }),
  discordVerified: boolean("discord_verified").default(false).notNull(),
  discordVerifiedAt: timestamp("discord_verified_at"),
  /** Referral tracking */
  referralCode: varchar("referral_code", { length: 16 }).unique(),
  referredBy: varchar("referred_by", { length: 16 }),
  /** Referral stats */
  referralCount: int("referral_count").default(0).notNull(),
  referralPointsEarned: int("referral_points_earned").default(0).notNull(),
  /** Timestamps */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WalletProfile = typeof walletProfiles.$inferSelect;
export type InsertWalletProfile = typeof walletProfiles.$inferInsert;

/**
 * Task completions - tracks individual task completions for each wallet
 * Used for daily tasks and one-time tasks
 */
export const taskCompletions = mysqlTable("task_completions", {
  id: serial("id").primaryKey(),
  /** Reference to wallet profile */
  walletAddress: varchar("wallet_address", { length: 128 }).notNull(),
  /** Task type identifier */
  taskType: varchar("task_type", { length: 64 }).notNull(),
  /** Points awarded for this completion */
  pointsAwarded: int("points_awarded").notNull(),
  /** For daily tasks: the UTC date (YYYY-MM-DD) this was completed */
  completionDate: varchar("completion_date", { length: 10 }),
  /** Additional metadata (e.g., tweet URL for X post tasks) */
  metadata: text("metadata"),
  /** Status: active or revoked (for deleted tweets) */
  status: varchar("status", { length: 16 }).default("active").notNull(),
  /** Completion timestamp */
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  /** Revoked timestamp (when admin marks tweet as deleted) */
  revokedAt: timestamp("revoked_at"),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = typeof taskCompletions.$inferInsert;

/**
 * Points history - detailed log of all point transactions
 * Useful for auditing and displaying history to users
 */
export const pointsHistory = mysqlTable("points_history", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 128 }).notNull(),
  /** Type of transaction: connect_bonus, x_connect, x_disconnect, discord_connect, discord_disconnect, daily_post, referral_bonus, referral_tier_bonus, admin_adjustment, other */
  transactionType: varchar("transaction_type", { length: 32 }).notNull(),
  /** Points change (positive for earning, negative for spending) */
  pointsChange: int("points_change").notNull(),
  /** Running total after this transaction */
  balanceAfter: int("balance_after").notNull(),
  /** Description of the transaction */
  description: text("description"),
  /** Timestamp */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = typeof pointsHistory.$inferInsert;

/**
 * Referrals - tracks individual referral relationships
 * Records who referred whom and the points awarded
 */
export const referrals = mysqlTable("referrals", {
  id: serial("id").primaryKey(),
  /** The wallet address of the referrer (who shared the code) */
  referrerWallet: varchar("referrer_wallet", { length: 128 }).notNull(),
  /** The wallet address of the referred user (who used the code) */
  referredWallet: varchar("referred_wallet", { length: 128 }).notNull().unique(),
  /** The referral code that was used */
  referralCode: varchar("referral_code", { length: 16 }).notNull(),
  /** Points awarded to the referrer for this referral */
  referrerPoints: int("referrer_points").default(0).notNull(),
  /** Points awarded to the referred user as bonus */
  referredPoints: int("referred_points").default(0).notNull(),
  /** Whether the referrer has claimed their bonus */
  referrerClaimed: boolean("referrer_claimed").default(false).notNull(),
  /** Whether the referred user has claimed their bonus */
  referredClaimed: boolean("referred_claimed").default(false).notNull(),
  /** Timestamp when the referral was created */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  /** Timestamp when the bonus was claimed */
  claimedAt: timestamp("claimed_at"),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Referral tiers - defines bonus tiers based on referral count
 * Used to calculate tier bonuses for referrers
 */
export const referralTiers = mysqlTable("referral_tiers", {
  id: serial("id").primaryKey(),
  /** Tier name (e.g., Bronze, Silver, Gold, Platinum, Diamond) */
  tierName: varchar("tier_name", { length: 32 }).notNull(),
  /** Minimum referrals required to reach this tier */
  minReferrals: int("min_referrals").notNull(),
  /** Bonus points per referral at this tier */
  bonusPerReferral: int("bonus_per_referral").notNull(),
  /** Percentage bonus on referred user's points (0-100) */
  percentageBonus: int("percentage_bonus").default(10).notNull(),
  /** Tier color for UI display */
  tierColor: varchar("tier_color", { length: 16 }),
});

export type ReferralTier = typeof referralTiers.$inferSelect;
export type InsertReferralTier = typeof referralTiers.$inferInsert;
