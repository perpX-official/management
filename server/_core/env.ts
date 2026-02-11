/**
 * Environment configuration for PerpDEX
 * Compatible with Vercel + Supabase deployment
 */
export const ENV = {
  // App identification
  appId: process.env.VITE_APP_ID ?? "perpdex",
  
  // Authentication
  cookieSecret: process.env.JWT_SECRET ?? "",
  adminWalletAddress: process.env.ADMIN_WALLET_ADDRESS ?? "",
  
  // Database (Supabase PostgreSQL)
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Environment
  isProduction: process.env.NODE_ENV === "production",
  
  // Social OAuth (X/Twitter, Discord)
  xClientId: process.env.X_CLIENT_ID ?? "",
  xClientSecret: process.env.X_CLIENT_SECRET ?? "",
  discordClientId: process.env.DISCORD_CLIENT_ID ?? "",
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
  
  // App URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000",
};
