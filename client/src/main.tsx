import { trpc } from "@/lib/trpc";
import { withApiBase } from "@/lib/apiBase";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const REWARDS_IDENTITY_STORAGE_KEY = "perpx_rewards_identity";
const REWARDS_STATE_STORAGE_KEY = "perpx_rewards_state";

function getRewardsIdentityWalletFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const normalize = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  try {
    const identityRaw = localStorage.getItem(REWARDS_IDENTITY_STORAGE_KEY);
    if (identityRaw) {
      const identityParsed = JSON.parse(identityRaw) as { address?: unknown };
      const identityWallet = normalize(identityParsed?.address);
      if (identityWallet) return identityWallet;
    }
  } catch {
    // ignore invalid JSON
  }

  try {
    const stateRaw = localStorage.getItem(REWARDS_STATE_STORAGE_KEY);
    if (stateRaw) {
      const stateParsed = JSON.parse(stateRaw) as { address?: unknown; isConnected?: unknown };
      if (stateParsed?.isConnected === true) {
        const stateWallet = normalize(stateParsed?.address);
        if (stateWallet) return stateWallet;
      }
    }
  } catch {
    // ignore invalid JSON
  }

  return null;
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcUrl = withApiBase("/api/trpc");

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch(input, init) {
        const identityWallet = getRewardsIdentityWalletFromStorage();
        const headers = new Headers(init?.headers || undefined);
        if (identityWallet) {
          headers.set("x-perpx-rewards-wallet", identityWallet);
        } else {
          headers.delete("x-perpx-rewards-wallet");
        }

        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
