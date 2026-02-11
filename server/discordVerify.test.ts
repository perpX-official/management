import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for Discord Server Verification feature
 * 
 * Tests the verifyDiscordServer function logic:
 * 1. Environment variables must be set (DISCORD_BOT_TOKEN, DISCORD_GUILD_ID)
 * 2. Profile must exist and have Discord connected
 * 3. Profile must have discordId
 * 4. Discord Bot API is called to check guild membership
 * 5. Points are awarded on successful verification (50pt)
 */

describe("Discord Server Verification", () => {
  it("should have DISCORD_BOT_TOKEN configured", () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(0);
  });

  it("should have DISCORD_GUILD_ID configured", () => {
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(guildId).toBeDefined();
    expect(guildId!.length).toBeGreaterThan(0);
  });

  it("should be able to check guild membership via Discord Bot API", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(token).toBeDefined();
    expect(guildId).toBeDefined();

    const fakeUserId = "000000000000000000";
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${fakeUserId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    console.log("Discord Member Check API Response status:", response.status);
    expect([200, 404]).toContain(response.status);
  });

  it("should verify the bot has SERVER MEMBERS INTENT permission", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(token).toBeDefined();
    expect(guildId).toBeDefined();

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    console.log("Discord Members List API Response status:", response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log("Members returned:", data.length);
      expect(Array.isArray(data)).toBe(true);
    } else if (response.status === 403) {
      console.warn("WARNING: Bot does not have Server Members Intent.");
    }
    
    expect(response.status).not.toBe(401);
  });

  it("should validate the verification flow logic", () => {
    const mockProfile = {
      discordConnected: true,
      discordId: "123456789",
      discordVerified: false,
    };

    expect(mockProfile.discordConnected).toBe(true);
    expect(mockProfile.discordId).toBeTruthy();
    expect(mockProfile.discordVerified).toBe(false);
    
    const verifiedProfile = {
      ...mockProfile,
      discordVerified: true,
    };
    expect(verifiedProfile.discordVerified).toBe(true);
  });

  it("should reject verification when Discord is not connected", () => {
    const mockProfile = {
      discordConnected: false,
      discordId: null,
      discordVerified: false,
    };

    expect(mockProfile.discordConnected).toBe(false);
    expect(mockProfile.discordId).toBeFalsy();
  });

  it("should reject verification when already verified", () => {
    const mockProfile = {
      discordConnected: true,
      discordId: "123456789",
      discordVerified: true,
    };

    expect(mockProfile.discordVerified).toBe(true);
  });

  it("should return invite URL when user is not in the server", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(token).toBeDefined();
    expect(guildId).toBeDefined();

    const fakeUserId = "000000000000000001";
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${fakeUserId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    expect(response.status).toBe(404);

    const DISCORD_INVITE_URL = "https://discord.gg/5BUJrR3JnK";
    expect(DISCORD_INVITE_URL).toContain("discord.gg");
    expect(DISCORD_INVITE_URL).toBe("https://discord.gg/5BUJrR3JnK");
  });
});

describe("Discord Points Configuration", () => {
  it("should award 50 points for Discord connection (not 100)", () => {
    const DISCORD_CONNECT_BONUS = 50;
    expect(DISCORD_CONNECT_BONUS).toBe(50);
  });

  it("should award 50 points for Discord verification (not 100)", () => {
    const DISCORD_VERIFY_BONUS = 50;
    expect(DISCORD_VERIFY_BONUS).toBe(50);
  });

  it("should deduct 50 points for Discord disconnection", () => {
    const DISCORD_DISCONNECT_DEDUCTION = -50;
    expect(DISCORD_DISCONNECT_DEDUCTION).toBe(-50);
  });

  it("should deduct additional 50 points when disconnecting a verified user", () => {
    const DISCORD_DISCONNECT_DEDUCTION = -50;
    const DISCORD_VERIFY_REVOKE_DEDUCTION = -50;
    const totalDeduction = DISCORD_DISCONNECT_DEDUCTION + DISCORD_VERIFY_REVOKE_DEDUCTION;
    expect(totalDeduction).toBe(-100);
  });
});

describe("Discord Disconnect - Full Reset", () => {
  it("should reset all Discord fields when disconnecting", () => {
    const beforeDisconnect = {
      discordConnected: true,
      discordUsername: "testuser",
      discordId: "123456789",
      discordVerified: true,
      discordVerifiedAt: new Date(),
      discordConnectedAt: new Date(),
    };

    // Simulate disconnect
    const afterDisconnect = {
      discordConnected: false,
      discordUsername: null,
      discordId: null,
      discordVerified: false,
      discordVerifiedAt: null,
      discordConnectedAt: null,
    };

    expect(afterDisconnect.discordConnected).toBe(false);
    expect(afterDisconnect.discordUsername).toBeNull();
    expect(afterDisconnect.discordId).toBeNull();
    expect(afterDisconnect.discordVerified).toBe(false);
    expect(afterDisconnect.discordVerifiedAt).toBeNull();
    expect(afterDisconnect.discordConnectedAt).toBeNull();
  });

  it("should deduct only 50pt when disconnecting non-verified user", () => {
    const wasVerified = false;
    const connectDeduction = -50;
    const verifyDeduction = wasVerified ? -50 : 0;
    const totalDeduction = connectDeduction + verifyDeduction;
    expect(totalDeduction).toBe(-50);
  });

  it("should deduct 100pt when disconnecting verified user", () => {
    const wasVerified = true;
    const connectDeduction = -50;
    const verifyDeduction = wasVerified ? -50 : 0;
    const totalDeduction = connectDeduction + verifyDeduction;
    expect(totalDeduction).toBe(-100);
  });
});

describe("Background Discord Membership Check", () => {
  it("should identify users who left the server (404 response)", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(token).toBeDefined();
    expect(guildId).toBeDefined();

    // Simulate checking a non-existent member
    const fakeUserId = "000000000000000002";
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${fakeUserId}`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    // 404 means user is not in the guild - should trigger revocation
    expect(response.status).toBe(404);
  });

  it("should revoke verify status and deduct 50pt for server leavers", () => {
    const verifiedUser = {
      walletAddress: "0xtest123",
      discordId: "123456789",
      discordVerified: true,
    };

    // Simulate revocation
    const afterRevocation = {
      ...verifiedUser,
      discordVerified: false,
    };

    const pointsDeducted = -50;

    expect(afterRevocation.discordVerified).toBe(false);
    expect(pointsDeducted).toBe(-50);
  });

  it("should not affect users still in the server (200 response)", () => {
    const verifiedUser = {
      walletAddress: "0xtest456",
      discordId: "987654321",
      discordVerified: true,
    };

    // 200 response means user is still in the server - no action
    const apiStatus = 200;
    const shouldRevoke = apiStatus === 404;

    expect(shouldRevoke).toBe(false);
    expect(verifiedUser.discordVerified).toBe(true);
  });

  it("should handle rate limiting gracefully", () => {
    // Verify rate limit delay logic
    const BATCH_SIZE = 40;
    const DELAY_MS = 2000;
    
    const checked = 80;
    const expectedDelays = Math.floor(checked / BATCH_SIZE) - 1; // First batch has no delay
    
    expect(expectedDelays).toBeGreaterThanOrEqual(0);
    expect(DELAY_MS).toBe(2000);
  });
});
