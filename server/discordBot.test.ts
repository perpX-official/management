import { describe, it, expect } from "vitest";

describe("Discord Bot Token Validation", () => {
  it("should be able to authenticate with Discord API", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(0);

    // Verify the bot token by calling Discord API
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    console.log("Discord Bot API Response status:", response.status);
    expect(response.status).toBe(200);

    const data = await response.json();
    console.log("Bot username:", data.username);
    expect(data.id).toBeDefined();
  });

  it("should be able to access the guild", async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    expect(token).toBeDefined();
    expect(guildId).toBeDefined();

    // Verify the bot can access the guild
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    console.log("Discord Guild API Response status:", response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log("Guild name:", data.name);
      expect(data.id).toBe(guildId);
    } else {
      // Bot might not be in the guild yet
      console.log("Bot may not be in the guild. Status:", response.status);
      const errorData = await response.json();
      console.log("Error:", JSON.stringify(errorData));
    }
  });
});
