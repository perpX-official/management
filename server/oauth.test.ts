import { describe, it, expect } from "vitest";

/**
 * Test OAuth environment variables are configured
 */
describe("OAuth Configuration", () => {
  it("should have X_CLIENT_ID configured", () => {
    const clientId = process.env.X_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId!.length).toBeGreaterThan(10);
  });

  it("should have X_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.X_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret!.length).toBeGreaterThan(10);
  });

  it("should have DISCORD_CLIENT_ID configured", () => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    // Discord client IDs are numeric strings
    expect(/^\d+$/.test(clientId!)).toBe(true);
  });

  it("should have DISCORD_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret!.length).toBeGreaterThan(10);
  });

  it("should have ADMIN_PASSWORD configured", () => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    expect(adminPassword).toBeDefined();
    expect(adminPassword).not.toBe("");
    expect(adminPassword!.length).toBeGreaterThan(5);
  });
});
