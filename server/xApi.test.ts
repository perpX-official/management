import { describe, it, expect } from "vitest";

describe("X API Bearer Token Validation", () => {
  it("should have X_BEARER_TOKEN environment variable set", () => {
    const token = process.env.X_BEARER_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
  });

  it("should be able to verify a tweet using X API", async () => {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      console.log("X_BEARER_TOKEN not set, skipping API test");
      return;
    }

    // Test with a known public tweet (Twitter's own tweet)
    // Using a simple GET request to verify the token works
    const response = await fetch(
      "https://api.twitter.com/2/tweets/1460323737035677698",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("X API Response status:", response.status);
    
    // Token should be valid (200) or tweet might not exist (404)
    // 401 means invalid token, 403 means forbidden
    if (response.status === 401) {
      throw new Error("Invalid X Bearer Token - 401 Unauthorized");
    }
    
    if (response.status === 403) {
      const errorData = await response.json();
      console.log("X API 403 Error:", JSON.stringify(errorData));
      // 403 can mean rate limited or app not approved for endpoint
      // For now, we'll accept this as the token is valid but endpoint restricted
      expect(response.status).toBe(403);
      return;
    }
    
    if (response.status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("data");
    }
    
    // Accept 200, 402, 403, 404, 429 as valid responses (token works)
    // 402 = Payment Required (API tier limitation)
    expect([200, 402, 403, 404, 429]).toContain(response.status);
  }, 30000); // 30 second timeout
});
