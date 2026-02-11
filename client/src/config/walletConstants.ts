// WalletConnect Project ID (shared across all chains)
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  '7b3c2778deabef041da731133fab3568';

// TRON chain IDs
export const TRON_CHAINS = {
  mainnet: 'tron:0x2b6653dc',
  shasta: 'tron:0x94a9059e',
  nile: 'tron:0xcd8690dc',
} as const;

export const TRON_CHAIN_NAMES: Record<string, string> = {
  'tron:0x2b6653dc': 'Mainnet',
  'tron:0x94a9059e': 'Shasta Testnet',
  'tron:0xcd8690dc': 'Nile Testnet',
};

export const TRON_FULL_NODES: Record<string, string> = {
  'tron:0x2b6653dc': 'https://api.trongrid.io',
  'tron:0x94a9059e': 'https://api.shasta.trongrid.io',
  'tron:0xcd8690dc': 'https://nile.trongrid.io',
};

export const TRON_EXPLORERS: Record<string, string> = {
  'tron:0x2b6653dc': 'https://tronscan.org',
  'tron:0x94a9059e': 'https://shasta.tronscan.org',
  'tron:0xcd8690dc': 'https://nile.tronscan.org',
};

// Solana chain
export const SOLANA_CHAINS = {
  mainnet: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
} as const;

// TRON mobile wallets for WalletConnect
export const TRON_MOBILE_WALLETS = [
  {
    name: 'Trust Wallet',
    deepLink: 'trust://wc',
    universalLink: 'https://link.trustwallet.com/wc',
  },
  {
    name: 'SafePal',
    deepLink: 'safepal://wc',
    universalLink: 'https://link.safepal.io/wc',
  },
  {
    name: 'OKX Wallet',
    deepLink: 'okex://main/wc',
    universalLink: 'https://www.okx.com/download',
  },
];

// Solana injected wallet IDs
export const SOLANA_WALLETS = [
  { id: 'phantom', name: 'Phantom', windowKey: 'solana', icon: '👻' },
  { id: 'solflare', name: 'Solflare', windowKey: 'solflare', icon: '🔥' },
  { id: 'backpack', name: 'Backpack', windowKey: 'backpack', icon: '🎒' },
  { id: 'okx', name: 'OKX Wallet', windowKey: 'okxwallet.solana', icon: '⭕' },
  { id: 'bitget', name: 'Bitget Wallet', windowKey: 'bitkeep.solana', icon: '💎' },
] as const;

// App metadata for WalletConnect
export const WC_METADATA = {
  name: 'PerpX',
  description: 'Next-Gen Perpetual Trading',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://perpx.fi',
  icons: ['/logo.png'],
};

// Helper: detect mobile device
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Helper: validate Tron address format
export function isTronAddress(addr: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
}
