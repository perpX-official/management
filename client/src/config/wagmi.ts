import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, base, optimism } from '@reown/appkit/networks';
import { createStorage, injected } from '@wagmi/core';
import { walletConnect } from '@wagmi/connectors';

// WalletConnect Project ID - https://cloud.walletconnect.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '7b3c2778deabef041da731133fab3568';

// Metadata for WalletConnect
export const metadata = {
  name: 'PerpX',
  description: 'Next-Gen Perpetual Trading',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://perpx.fi',
  icons: ['/logo.png']
};

// Supported networks
export const networks = [mainnet, arbitrum, base, optimism];

// Noop storage: prevents wagmi from persisting connection state
// This ensures EVM wallets do NOT auto-reconnect on page load or
// when switching to Tron/Solana chains
const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

// Create wagmi adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: noopStorage
  }),
  ssr: false,
  projectId,
  networks,
  connectors: [
    injected({
      target: {
        id: 'metaMask',
        name: 'MetaMask',
        provider: (window: Window) => {
          const ethereum = (window as any).ethereum;
          if (!ethereum) return undefined;
          const providers = Array.isArray(ethereum.providers) ? ethereum.providers : [];
          const metaMaskProvider =
            providers.find((p: any) => p?.isMetaMask && !p?.isPhantom) ||
            providers.find((p: any) => p?.isMetaMask);
          if (metaMaskProvider) return metaMaskProvider;
          if (ethereum.isMetaMask && !ethereum.isPhantom) return ethereum;
          return undefined;
        },
      },
      shimDisconnect: true,
    }),
    walletConnect({
      projectId,
      metadata,
      showQrModal: false,
    }),
  ]
});

// Export config for WagmiProvider
export const config = wagmiAdapter.wagmiConfig;
