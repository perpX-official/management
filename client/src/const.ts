export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "PerpDEX";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/logo.png";

/**
 * Get login URL - for wallet-based auth, this returns the connect wallet page
 * Note: With wallet authentication, users connect their wallet directly
 * This function is kept for compatibility but redirects to home
 */
export const getLoginUrl = () => {
  // With wallet-based auth, we don't need OAuth redirect
  // Users connect wallet directly on the page
  return "/";
};

/**
 * API base URL for backend calls
 */
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "";
};
