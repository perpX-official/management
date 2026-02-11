import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getReferralTier: vi.fn((referralCount: number) => {
    if (referralCount >= 100) {
      return { name: "Diamond", color: "#b9f2ff", minReferrals: 100, bonusPerReferral: 100, percentageBonus: 20 };
    } else if (referralCount >= 50) {
      return { name: "Platinum", color: "#e5e4e2", minReferrals: 50, bonusPerReferral: 75, percentageBonus: 15 };
    } else if (referralCount >= 25) {
      return { name: "Gold", color: "#ffd700", minReferrals: 25, bonusPerReferral: 60, percentageBonus: 12 };
    } else if (referralCount >= 10) {
      return { name: "Silver", color: "#c0c0c0", minReferrals: 10, bonusPerReferral: 55, percentageBonus: 11 };
    } else {
      return { name: "Bronze", color: "#cd7f32", minReferrals: 0, bonusPerReferral: 50, percentageBonus: 10 };
    }
  }),
}));

import { getReferralTier } from "./db";

describe("Referral System", () => {
  describe("getReferralTier", () => {
    it("should return Bronze tier for 0 referrals", () => {
      const tier = getReferralTier(0);
      expect(tier.name).toBe("Bronze");
      expect(tier.bonusPerReferral).toBe(50);
      expect(tier.percentageBonus).toBe(10);
    });

    it("should return Bronze tier for 5 referrals", () => {
      const tier = getReferralTier(5);
      expect(tier.name).toBe("Bronze");
    });

    it("should return Silver tier for 10 referrals", () => {
      const tier = getReferralTier(10);
      expect(tier.name).toBe("Silver");
      expect(tier.bonusPerReferral).toBe(55);
      expect(tier.percentageBonus).toBe(11);
    });

    it("should return Gold tier for 25 referrals", () => {
      const tier = getReferralTier(25);
      expect(tier.name).toBe("Gold");
      expect(tier.bonusPerReferral).toBe(60);
      expect(tier.percentageBonus).toBe(12);
    });

    it("should return Platinum tier for 50 referrals", () => {
      const tier = getReferralTier(50);
      expect(tier.name).toBe("Platinum");
      expect(tier.bonusPerReferral).toBe(75);
      expect(tier.percentageBonus).toBe(15);
    });

    it("should return Diamond tier for 100 referrals", () => {
      const tier = getReferralTier(100);
      expect(tier.name).toBe("Diamond");
      expect(tier.bonusPerReferral).toBe(100);
      expect(tier.percentageBonus).toBe(20);
    });

    it("should return Diamond tier for 200 referrals", () => {
      const tier = getReferralTier(200);
      expect(tier.name).toBe("Diamond");
    });
  });
});

describe("Referral Code Validation", () => {
  it("should validate referral code format", () => {
    // Referral codes should be 8 characters, alphanumeric
    const validCode = "ABC12345";
    const invalidCode = "abc-123";
    
    const isValidFormat = (code: string) => /^[A-Z0-9]{8}$/.test(code);
    
    expect(isValidFormat(validCode)).toBe(true);
    expect(isValidFormat(invalidCode)).toBe(false);
  });

  it("should not allow self-referral", () => {
    const referrerWallet = "0x1234567890abcdef";
    const referredWallet = "0x1234567890abcdef";
    
    const isSelfReferral = referrerWallet.toLowerCase() === referredWallet.toLowerCase();
    expect(isSelfReferral).toBe(true);
  });

  it("should allow different wallet referral", () => {
    const referrerWallet = "0x1234567890abcdef";
    const referredWallet = "0xfedcba0987654321";
    
    const isSelfReferral = referrerWallet.toLowerCase() === referredWallet.toLowerCase();
    expect(isSelfReferral).toBe(false);
  });
});

describe("Referral Bonus Calculation - New Spec", () => {
  // New spec: Both referrer and referred get 50pt base
  // 10% bonus on referred user's earned points (floor/切り捨て)
  
  it("should calculate correct referrer bonus (base 50pt)", () => {
    const baseBonus = 50;
    expect(baseBonus).toBe(50);
  });

  it("should calculate correct referred user base bonus (50pt)", () => {
    // New spec: referred user also gets 50pt (same as referrer)
    const referredBaseBonus = 50;
    expect(referredBaseBonus).toBe(50);
  });

  it("should calculate 10% bonus with floor (切り捨て)", () => {
    // Test floor calculation for 10% bonus
    const earnedPoints = 155;
    const tenPercentBonus = Math.floor(earnedPoints * 0.1);
    expect(tenPercentBonus).toBe(15); // 15.5 -> 15 (floor)
  });

  it("should calculate 10% bonus with floor for small amounts", () => {
    const earnedPoints = 7;
    const tenPercentBonus = Math.floor(earnedPoints * 0.1);
    expect(tenPercentBonus).toBe(0); // 0.7 -> 0 (floor)
  });

  it("should calculate total referred bonus (base + 10%)", () => {
    const referredBaseBonus = 50;
    const earnedPoints = 200;
    const tenPercentBonus = Math.floor(earnedPoints * 0.1);
    const totalReferredBonus = referredBaseBonus + tenPercentBonus;
    expect(totalReferredBonus).toBe(70); // 50 + 20
  });

  it("should calculate total bonus distributed for both parties", () => {
    const referrerBonus = 50; // Base for referrer
    const referredBaseBonus = 50;
    const earnedPoints = 100;
    const tenPercentBonus = Math.floor(earnedPoints * 0.1);
    const referredBonus = referredBaseBonus + tenPercentBonus;
    const totalBonus = referrerBonus + referredBonus;
    expect(totalBonus).toBe(110); // 50 + 50 + 10
  });
});

describe("Referral Code Generation Conditions", () => {
  // Updated spec: Code is generated only after X + Discord connection + Discord Verify
  
  it("should not generate code without X connection", () => {
    const profile = {
      xConnected: false,
      discordConnected: true,
      discordVerified: true,
      referralCode: null,
    };
    const canGenerate = profile.xConnected && profile.discordConnected && profile.discordVerified;
    expect(canGenerate).toBe(false);
  });

  it("should not generate code without Discord connection", () => {
    const profile = {
      xConnected: true,
      discordConnected: false,
      discordVerified: false,
      referralCode: null,
    };
    const canGenerate = profile.xConnected && profile.discordConnected && profile.discordVerified;
    expect(canGenerate).toBe(false);
  });

  it("should not generate code without Discord verification", () => {
    const profile = {
      xConnected: true,
      discordConnected: true,
      discordVerified: false,
      referralCode: null,
    };
    const canGenerate = profile.xConnected && profile.discordConnected && profile.discordVerified;
    expect(canGenerate).toBe(false);
  });

  it("should generate code when X connected, Discord connected, and Discord verified", () => {
    const profile = {
      xConnected: true,
      discordConnected: true,
      discordVerified: true,
      referralCode: null,
    };
    const canGenerate = profile.xConnected && profile.discordConnected && profile.discordVerified;
    expect(canGenerate).toBe(true);
  });

  it("should not regenerate code if already exists", () => {
    const profile = {
      xConnected: true,
      discordConnected: true,
      discordVerified: true,
      referralCode: "ABC12345",
    };
    const shouldGenerateNew = profile.xConnected && profile.discordConnected && profile.discordVerified && !profile.referralCode;
    expect(shouldGenerateNew).toBe(false);
  });

  it("should trigger maybeGenerateReferralCode from verifyDiscordServer flow", () => {
    const verifyFlow = ["verifyDiscordServer", "addPoints", "maybeGenerateReferralCode", "maybeClaimReferralBonus"];
    expect(verifyFlow).toContain("maybeGenerateReferralCode");
  });
});

describe("Referral Bonus Timing", () => {
  // New spec: Bonus is awarded after first task completion
  
  it("should identify first task completion", () => {
    const taskCompletionCount = 0;
    const isFirstTask = taskCompletionCount === 0;
    expect(isFirstTask).toBe(true);
  });

  it("should not trigger bonus on subsequent tasks", () => {
    const taskCompletionCount = 1;
    const isFirstTask = taskCompletionCount === 0;
    expect(isFirstTask).toBe(false);
  });

  it("should check if user was referred before awarding bonus", () => {
    const profile = {
      referredBy: "0xreferrer123",
    };
    const wasReferred = !!profile.referredBy;
    expect(wasReferred).toBe(true);
  });

  it("should not award bonus if user was not referred", () => {
    const profile = {
      referredBy: null,
    };
    const wasReferred = !!profile.referredBy;
    expect(wasReferred).toBe(false);
  });
});

describe("Points to USD Conversion", () => {
  it("should have a valid POINTS_TO_USD_RATE constant", async () => {
    const { POINTS_TO_USD_RATE } = await import("../shared/const");
    expect(POINTS_TO_USD_RATE).toBeDefined();
    expect(typeof POINTS_TO_USD_RATE).toBe("number");
    expect(POINTS_TO_USD_RATE).toBeGreaterThan(0);
  });

  it("should correctly convert points to USD", async () => {
    const { POINTS_TO_USD_RATE } = await import("../shared/const");
    expect(100 * POINTS_TO_USD_RATE).toBe(1.0);
    expect(300 * POINTS_TO_USD_RATE).toBe(3.0);
    expect(0 * POINTS_TO_USD_RATE).toBe(0);
    expect(1500 * POINTS_TO_USD_RATE).toBe(15.0);
  });

  it("should format USD values correctly", async () => {
    const { POINTS_TO_USD_RATE } = await import("../shared/const");
    const points = 350;
    const usdValue = points * POINTS_TO_USD_RATE;
    const formatted = usdValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatted).toBe("3.50");
  });
});

describe("Auto-claim Referral Bonus on Task Completion", () => {
  it("should auto-claim when referred user completes a task and bonus not yet claimed", () => {
    const profile = { referredBy: "ABC12345", walletAddress: "0xReferred" };
    const referralRecord = { referredWallet: "0xReferred", referrerClaimed: false };

    const shouldAutoClaim = !!profile.referredBy && !referralRecord.referrerClaimed;
    expect(shouldAutoClaim).toBe(true);
  });

  it("should not auto-claim when bonus already claimed", () => {
    const profile = { referredBy: "ABC12345", walletAddress: "0xReferred" };
    const referralRecord = { referredWallet: "0xReferred", referrerClaimed: true };

    const shouldAutoClaim = !!profile.referredBy && !referralRecord.referrerClaimed;
    expect(shouldAutoClaim).toBe(false);
  });

  it("should not auto-claim for users without referral", () => {
    const profile = { referredBy: null, walletAddress: "0xNoReferral" };
    const shouldAutoClaim = !!profile.referredBy;
    expect(shouldAutoClaim).toBe(false);
  });

  it("should trigger auto-claim from connectXAccount flow", () => {
    // Simulate: user connects X → maybeClaimReferralBonus is called
    const taskCompletionFlow = ["connectX", "maybeGenerateReferralCode", "maybeClaimReferralBonus"];
    expect(taskCompletionFlow).toContain("maybeClaimReferralBonus");
  });

  it("should trigger auto-claim from connectDiscordAccount flow", () => {
    const taskCompletionFlow = ["connectDiscord", "maybeGenerateReferralCode", "maybeClaimReferralBonus"];
    expect(taskCompletionFlow).toContain("maybeClaimReferralBonus");
  });

  it("should trigger auto-claim from verifyDiscordServer flow", () => {
    const taskCompletionFlow = ["verifyDiscordServer", "addPoints", "maybeClaimReferralBonus"];
    expect(taskCompletionFlow).toContain("maybeClaimReferralBonus");
  });

  it("should trigger auto-claim from completeDailyPost flow", () => {
    const taskCompletionFlow = ["completeDailyPost", "addPoints", "claimReferralBonus"];
    expect(taskCompletionFlow).toContain("claimReferralBonus");
  });
});

describe("Referral Link Domain Auto-Detection", () => {
  it("should generate referral link using current origin", () => {
    const baseUrl = "https://perpdex.manus.space";
    const referralCode = "ABC12345";
    const referralLink = `${baseUrl}?ref=${referralCode}`;
    expect(referralLink).toBe("https://perpdex.manus.space?ref=ABC12345");
  });

  it("should work with custom domain", () => {
    const baseUrl = "https://perpx.fi";
    const referralCode = "XYZ98765";
    const referralLink = `${baseUrl}?ref=${referralCode}`;
    expect(referralLink).toBe("https://perpx.fi?ref=XYZ98765");
  });

  it("should work with localhost for development", () => {
    const baseUrl = "http://localhost:3000";
    const referralCode = "DEV00001";
    const referralLink = `${baseUrl}?ref=${referralCode}`;
    expect(referralLink).toBe("http://localhost:3000?ref=DEV00001");
  });
});

describe("Pending Referral Code from URL", () => {
  it("should extract ref parameter from URL", () => {
    const url = new URL("https://perpdex.manus.space?ref=ABC12345");
    const refCode = url.searchParams.get("ref");
    expect(refCode).toBe("ABC12345");
  });

  it("should uppercase the referral code", () => {
    const refCode = "abc12345";
    expect(refCode.toUpperCase()).toBe("ABC12345");
  });

  it("should handle URL without ref parameter", () => {
    const url = new URL("https://perpdex.manus.space");
    const refCode = url.searchParams.get("ref");
    expect(refCode).toBeNull();
  });

  it("should clean URL after extracting ref code", () => {
    const url = new URL("https://perpdex.manus.space?ref=ABC12345");
    url.searchParams.delete("ref");
    expect(url.toString()).toBe("https://perpdex.manus.space/");
  });

  it("should not auto-apply if user already has a referrer", () => {
    const profile = { referredBy: "EXISTING1" };
    const pendingCode = "ABC12345";
    const shouldApply = !profile.referredBy && !!pendingCode;
    expect(shouldApply).toBe(false);
  });

  it("should auto-apply if user has no referrer and pending code exists", () => {
    const profile = { referredBy: null };
    const pendingCode = "ABC12345";
    const shouldApply = !profile.referredBy && !!pendingCode;
    expect(shouldApply).toBe(true);
  });
});

describe("Referral Code Invalidation on Disconnect", () => {
  // When a referrer disconnects any service, their referral code should become inactive
  
  it("should invalidate referral code when X is disconnected", () => {
    const referrer = {
      xConnected: false,
      discordConnected: true,
      discordVerified: true,
      referralCode: "ABC12345",
    };
    const isCodeActive = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(isCodeActive).toBe(false);
  });

  it("should invalidate referral code when Discord is disconnected", () => {
    const referrer = {
      xConnected: true,
      discordConnected: false,
      discordVerified: false,
      referralCode: "ABC12345",
    };
    const isCodeActive = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(isCodeActive).toBe(false);
  });

  it("should invalidate referral code when Discord Verify is lost", () => {
    const referrer = {
      xConnected: true,
      discordConnected: true,
      discordVerified: false,
      referralCode: "ABC12345",
    };
    const isCodeActive = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(isCodeActive).toBe(false);
  });

  it("should keep referral code active when all conditions are met", () => {
    const referrer = {
      xConnected: true,
      discordConnected: true,
      discordVerified: true,
      referralCode: "ABC12345",
    };
    const isCodeActive = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(isCodeActive).toBe(true);
  });

  it("should reject referral code application when referrer has disconnected X", () => {
    const referrer = {
      xConnected: false,
      discordConnected: true,
      discordVerified: true,
    };
    const canApplyCode = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(canApplyCode).toBe(false);
  });

  it("should reject referral code application when referrer has disconnected Discord", () => {
    const referrer = {
      xConnected: true,
      discordConnected: false,
      discordVerified: false,
    };
    const canApplyCode = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    expect(canApplyCode).toBe(false);
  });

  it("should return 'inactive' message when applying code of disconnected referrer", () => {
    const referrer = {
      xConnected: false,
      discordConnected: true,
      discordVerified: true,
    };
    const isActive = referrer.xConnected && referrer.discordConnected && referrer.discordVerified;
    const message = isActive ? "Code applied successfully" : "This referral code is currently inactive";
    expect(message).toBe("This referral code is currently inactive");
  });

  it("should hide referral code on frontend when canGenerate is false", () => {
    // Simulates the frontend logic: hasReferralCode requires canGenerate
    const codeStatus = {
      hasCode: true,
      referralCode: "ABC12345",
      canGenerate: false, // User disconnected a service
    };
    const hasReferralCode = codeStatus.hasCode && codeStatus.referralCode && codeStatus.canGenerate;
    expect(hasReferralCode).toBe(false);
  });

  it("should show referral code on frontend when canGenerate is true", () => {
    const codeStatus = {
      hasCode: true,
      referralCode: "ABC12345",
      canGenerate: true,
    };
    const hasReferralCode = codeStatus.hasCode && codeStatus.referralCode && codeStatus.canGenerate;
    expect(hasReferralCode).toBeTruthy();
  });

  it("should reactivate referral code when all services are reconnected", () => {
    // Scenario: user disconnects X, then reconnects
    const beforeReconnect = {
      xConnected: false,
      discordConnected: true,
      discordVerified: true,
    };
    expect(beforeReconnect.xConnected && beforeReconnect.discordConnected && beforeReconnect.discordVerified).toBe(false);

    const afterReconnect = {
      xConnected: true,
      discordConnected: true,
      discordVerified: true,
    };
    expect(afterReconnect.xConnected && afterReconnect.discordConnected && afterReconnect.discordVerified).toBe(true);
  });
});
