import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import socialOAuthRouter from "../socialOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { cronCheckAllTweets } from "../db";

const useMockRewards = process.env.REWARDS_MOCK === "1";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Social OAuth routes (X, Discord)
  app.use("/api/social", socialOAuthRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Schedule daily tweet existence check at UTC 00:00 (skip in mock mode)
  if (!useMockRewards) {
    scheduleDailyTweetCheck();
  } else {
    console.log("[Cron] Rewards mock mode enabled; skipping daily tweet check");
  }
}

/**
 * Schedule a daily cron job at UTC 00:00 to check if users' tweets still exist.
 * Uses setInterval with time-based triggering instead of a cron library.
 */
function scheduleDailyTweetCheck() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const CHECK_INTERVAL = 60 * 1000; // Check every minute if it's time

  let lastRunDate = "";

  const checkAndRun = async () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const utcDateStr = now.toISOString().split("T")[0];

    // Run at UTC 00:00 (first minute of the day), only once per day
    if (utcHour === 0 && utcMinute === 0 && lastRunDate !== utcDateStr) {
      lastRunDate = utcDateStr;
      console.log(`[Cron] Starting daily tweet check at ${now.toISOString()}`);
      try {
        const result = await cronCheckAllTweets();
        console.log(`[Cron] Tweet check complete:`, result);
      } catch (error) {
        console.error(`[Cron] Tweet check failed:`, error);
      }
    }
  };

  // Check every minute
  setInterval(checkAndRun, CHECK_INTERVAL);
  console.log("[Cron] Daily tweet existence check scheduled for UTC 00:00");
}

startServer().catch(console.error);
