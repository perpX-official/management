function normalizeBase(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function resolveApiBase() {
  const fromEnv = normalizeBase(import.meta.env.VITE_API_BASE_URL || "");

  // Guard against shipping local dev endpoints in production builds.
  if (fromEnv && typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local");
    const pointsToLocalDev =
      fromEnv.includes("localhost") || fromEnv.includes("127.0.0.1");

    if (!(pointsToLocalDev && !isLocalHost)) {
      return fromEnv;
    }
  } else if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "perpx.fi" || host === "www.perpx.fi" || host.endsWith(".perpx.fi")) {
      return host === "api.perpx.fi" ? "" : "https://api.perpx.fi";
    }
  }

  return "";
}

export function withApiBase(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBase();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
