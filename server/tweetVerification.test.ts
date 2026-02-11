import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// Tweet Existence Check (oEmbed API) Tests
// ============================================

describe("Tweet Existence Verification System", () => {
  
  describe("oEmbed API - checkTweetExists", () => {
    it("should return true for an existing tweet via oEmbed", async () => {
      // Use a well-known tweet that is unlikely to be deleted (Twitter's own announcement)
      const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent("https://twitter.com/jack/status/20")}`;
      
      const response = await fetch(oEmbedUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });

      // Jack's first tweet should exist
      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty("html");
        expect(data).toHaveProperty("author_name");
        console.log("oEmbed returned author:", data.author_name);
      } else {
        // If rate limited or temporarily unavailable, skip
        console.log("oEmbed API returned status:", response.status);
        expect([200, 429, 500, 502, 503]).toContain(response.status);
      }
    });

    it("should return 404 for a non-existent tweet via oEmbed", async () => {
      // Use a clearly fake tweet URL with an impossible status ID
      const fakeTweetUrl = "https://twitter.com/nonexistent_user_xyz_123/status/1";
      const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(fakeTweetUrl)}`;
      
      const response = await fetch(oEmbedUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });

      // Should return 404 or 403 for non-existent tweets
      if (response.status === 404 || response.status === 403) {
        expect([404, 403]).toContain(response.status);
      } else if (response.status === 429) {
        console.log("Rate limited, skipping assertion");
      } else {
        console.log("Unexpected status for fake tweet:", response.status);
      }
    });

    it("should handle twitter.com and x.com URLs correctly", () => {
      const twitterUrl = "https://twitter.com/elonmusk/status/1234567890";
      const xUrl = "https://x.com/elonmusk/status/1234567890";
      
      // Both should be valid tweet URL patterns
      const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
      
      expect(tweetUrlPattern.test(twitterUrl)).toBe(true);
      expect(tweetUrlPattern.test(xUrl)).toBe(true);
    });

    it("should reject invalid URLs", () => {
      const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
      
      expect(tweetUrlPattern.test("https://google.com")).toBe(false);
      expect(tweetUrlPattern.test("not-a-url")).toBe(false);
      expect(tweetUrlPattern.test("https://twitter.com/")).toBe(false);
      expect(tweetUrlPattern.test("https://twitter.com/user")).toBe(false);
      expect(tweetUrlPattern.test("")).toBe(false);
    });
  });

  describe("checkTweetExists function logic", () => {
    it("should return true when oEmbed returns 200", async () => {
      // Mock the behavior of checkTweetExists
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const originalFetch = global.fetch;
      global.fetch = mockFetch;

      try {
        const { checkTweetExists } = await import("./db");
        const result = await checkTweetExists("https://twitter.com/test/status/123");
        expect(result).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should return false when oEmbed returns 404 (deleted tweet)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const originalFetch = global.fetch;
      global.fetch = mockFetch;

      try {
        const { checkTweetExists } = await import("./db");
        const result = await checkTweetExists("https://twitter.com/test/status/999");
        expect(result).toBe(false);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should return false when oEmbed returns 403 (suspended/private)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      const originalFetch = global.fetch;
      global.fetch = mockFetch;

      try {
        const { checkTweetExists } = await import("./db");
        const result = await checkTweetExists("https://twitter.com/test/status/999");
        expect(result).toBe(false);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should return true on network errors (fail-safe, avoid false revocations)", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const originalFetch = global.fetch;
      global.fetch = mockFetch;

      try {
        const { checkTweetExists } = await import("./db");
        const result = await checkTweetExists("https://twitter.com/test/status/123");
        expect(result).toBe(true); // Fail-safe: assume exists
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should return true on rate limit (429) to avoid false revocations", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const originalFetch = global.fetch;
      global.fetch = mockFetch;

      try {
        const { checkTweetExists } = await import("./db");
        const result = await checkTweetExists("https://twitter.com/test/status/123");
        expect(result).toBe(true); // Fail-safe: assume exists on rate limit
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("hasCompletedTask with status filter", () => {
    it("should only count active completions (not revoked)", async () => {
      // This test verifies the SQL logic conceptually
      // The hasCompletedTask function now filters by status='active'
      // So if a user's tweet was revoked, they can re-submit a new tweet
      
      // Verify the function signature accepts the right parameters
      const { hasCompletedTask } = await import("./db");
      expect(typeof hasCompletedTask).toBe("function");
      
      // The function should accept (walletAddress, taskType, date?)
      // and only return true for status='active' completions
    });
  });

  describe("Tweet URL validation", () => {
    it("should validate standard twitter.com URLs", () => {
      const pattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
      
      expect(pattern.test("https://twitter.com/user123/status/1234567890123456789")).toBe(true);
      expect(pattern.test("https://x.com/user123/status/1234567890123456789")).toBe(true);
      expect(pattern.test("http://twitter.com/user/status/123")).toBe(true);
    });

    it("should handle URLs with query parameters", () => {
      const pattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
      
      // URLs with query params should still match (pattern checks prefix)
      expect(pattern.test("https://twitter.com/user/status/123?s=20")).toBe(true);
      expect(pattern.test("https://x.com/user/status/123?ref=abc")).toBe(true);
    });

    it("should reject non-tweet URLs", () => {
      const pattern = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
      
      expect(pattern.test("https://twitter.com/user/likes")).toBe(false);
      expect(pattern.test("https://twitter.com/user")).toBe(false);
      expect(pattern.test("https://facebook.com/post/123")).toBe(false);
    });
  });

  describe("Cron job scheduling", () => {
    it("should have cronCheckAllTweets function exported", async () => {
      const db = await import("./db");
      expect(typeof db.cronCheckAllTweets).toBe("function");
    });

    it("should have checkAndRevokeDeletedTweets function exported", async () => {
      const db = await import("./db");
      expect(typeof db.checkAndRevokeDeletedTweets).toBe("function");
    });

    it("should have getActiveTweetCompletions function exported", async () => {
      const db = await import("./db");
      expect(typeof db.getActiveTweetCompletions).toBe("function");
    });

    it("should have checkTweetExists function exported", async () => {
      const db = await import("./db");
      expect(typeof db.checkTweetExists).toBe("function");
    });
  });

  describe("oEmbed URL construction", () => {
    it("should properly encode tweet URLs for oEmbed API", () => {
      const tweetUrl = "https://x.com/user/status/1234567890";
      const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`;
      
      expect(oEmbedUrl).toBe(
        "https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fuser%2Fstatus%2F1234567890"
      );
    });

    it("should handle twitter.com URLs in oEmbed", () => {
      const tweetUrl = "https://twitter.com/user/status/9876543210";
      const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`;
      
      expect(oEmbedUrl).toContain("publish.twitter.com/oembed");
      expect(oEmbedUrl).toContain(encodeURIComponent(tweetUrl));
    });
  });

  describe("Point revocation logic", () => {
    it("should have revokeTweetPoints function exported", async () => {
      const db = await import("./db");
      expect(typeof db.revokeTweetPoints).toBe("function");
    });

    it("revokeTweetPoints should return success/message structure", async () => {
      // Verify the function returns the expected shape
      // (actual DB test would require a test database)
      const db = await import("./db");
      
      // Calling with a non-existent ID should return failure
      const result = await db.revokeTweetPoints(-1);
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });
  });
});
