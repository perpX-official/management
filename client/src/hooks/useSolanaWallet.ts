import { useState, useCallback, useRef, useEffect } from 'react';
import type SignClient from '@walletconnect/sign-client';
import { getWalletConnectClient } from '@/lib/walletConnectClient';
import {
  SOLANA_CHAINS,
  SOLANA_WALLETS,
  isMobileDevice,
} from '@/config/walletConstants';

export type SolanaProviderType = 'phantom' | 'solflare' | 'backpack' | 'okx' | 'bitget' | 'walletconnect' | null;

export interface SolanaWalletState {
  address: string | null;
  isConnected: boolean;
  providerType: SolanaProviderType;
  isPending: boolean;
  error: string | null;
  walletName: string | null;
}

interface UseSolanaWalletReturn extends SolanaWalletState {
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  wcUri: string | null;
  availableWallets: Array<{ id: string; name: string; icon: string; available: boolean }>;
}

// Get injected Solana wallet provider
function getInjectedProvider(windowKey: string): any {
  const candidates = [windowKey];
  if (windowKey === 'solana') {
    // Phantom now exposes window.phantom.solana in some versions
    candidates.push('phantom.solana');
  }

  for (const key of candidates) {
    const parts = key.split('.');
    let obj: any = window;
    for (const part of parts) {
      obj = obj?.[part];
      if (!obj) break;
    }
    if (obj) return obj;
  }
  return null;
}

export function useSolanaWallet(): UseSolanaWalletReturn {
  const [state, setState] = useState<SolanaWalletState>({
    address: null,
    isConnected: false,
    providerType: null,
    isPending: false,
    error: null,
    walletName: null,
  });
  const [wcUri, setWcUri] = useState<string | null>(null);
  const signClientRef = useRef<SignClient | null>(null);
  const sessionRef = useRef<any>(null);
  const providerRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (signClientRef.current && sessionRef.current) {
        try {
          signClientRef.current.disconnect({
            topic: sessionRef.current.topic,
            reason: { code: 6000, message: 'User disconnected' },
          });
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Detect available wallets
  const availableWallets = SOLANA_WALLETS.map((w) => ({
    id: w.id,
    name: w.name,
    icon: w.icon,
    available: !!getInjectedProvider(w.windowKey),
  }));

  // Connect via injected wallet (Phantom, Solflare, etc.)
  const connectInjected = useCallback(async (walletId: string) => {
    const walletDef = SOLANA_WALLETS.find((w) => w.id === walletId);
    if (!walletDef) throw new Error(`Unknown wallet: ${walletId}`);

    const provider = getInjectedProvider(walletDef.windowKey);
    if (!provider) {
      throw new Error(`${walletDef.name} not found. Please install the extension.`);
    }

    providerRef.current = provider;

    // Connect
    let publicKey: string;
    if (typeof provider.connect === 'function') {
      const resp = await provider.connect();
      publicKey = resp?.publicKey?.toString() || provider.publicKey?.toString();
    } else if (provider.publicKey) {
      publicKey = provider.publicKey.toString();
    } else {
      throw new Error(`Cannot connect to ${walletDef.name}`);
    }

    if (!publicKey) {
      throw new Error('No public key returned from wallet');
    }

    setState({
      address: publicKey,
      isConnected: true,
      providerType: walletId as SolanaProviderType,
      isPending: false,
      error: null,
      walletName: walletDef.name,
    });
  }, []);

  // Connect via WalletConnect v2
  const connectWalletConnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isPending: true, error: null }));

    try {
      const client = await getWalletConnectClient();
      signClientRef.current = client;

      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          solana: {
            chains: [SOLANA_CHAINS.mainnet],
            methods: ['solana_signMessage', 'solana_signTransaction'],
            events: [],
          },
        },
      });

      if (uri) {
        setWcUri(uri);

        // On mobile, try to open Phantom
        if (isMobileDevice()) {
          const encodedUri = encodeURIComponent(uri);
          window.location.href = `phantom://wc?uri=${encodedUri}`;
        }
      }

      const session = await approval();
      sessionRef.current = session;
      setWcUri(null);

      // Extract address from session
      const accounts = session.namespaces?.solana?.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No Solana accounts found in WalletConnect session');
      }

      // Format: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:Address"
      const parts = accounts[0].split(':');
      const address = parts[parts.length - 1];

      setState({
        address,
        isConnected: true,
        providerType: 'walletconnect',
        isPending: false,
        error: null,
        walletName: 'WalletConnect',
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isPending: false,
        error: err?.message || 'WalletConnect connection failed',
      }));
      throw err;
    }
  }, []);

  // Main connect function
  const connect = useCallback(
    async (walletId?: string) => {
      setState((prev) => ({ ...prev, isPending: true, error: null }));
      try {
        if (walletId && walletId !== 'walletconnect') {
          // Try injected first
          const walletDef = SOLANA_WALLETS.find((w) => w.id === walletId);
          if (walletDef) {
            const provider = getInjectedProvider(walletDef.windowKey);
            if (provider) {
              await connectInjected(walletId);
              return;
            }
          }
          // Injected not available, fall back to WalletConnect
          await connectWalletConnect();
        } else if (walletId === 'walletconnect') {
          await connectWalletConnect();
        } else {
          // Auto: try first available injected wallet, then WalletConnect
          for (const w of SOLANA_WALLETS) {
            const provider = getInjectedProvider(w.windowKey);
            if (provider && !isMobileDevice()) {
              await connectInjected(w.id);
              return;
            }
          }
          await connectWalletConnect();
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isPending: false,
          error: err?.message || 'Connection failed',
        }));
        throw err;
      }
    },
    [connectInjected, connectWalletConnect]
  );

  // Disconnect
  const disconnect = useCallback(async () => {
    // Disconnect injected wallet
    if (providerRef.current?.disconnect) {
      try {
        await providerRef.current.disconnect();
      } catch {
        // ignore
      }
      providerRef.current = null;
    }

    // Disconnect WalletConnect
    if (signClientRef.current && sessionRef.current) {
      try {
        await signClientRef.current.disconnect({
          topic: sessionRef.current.topic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      } catch {
        // ignore
      }
      signClientRef.current = null;
      sessionRef.current = null;
    }

    setWcUri(null);
    setState({
      address: null,
      isConnected: false,
      providerType: null,
      isPending: false,
      error: null,
      walletName: null,
    });
  }, []);

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!state.address || !state.providerType) {
        throw new Error('Not connected');
      }

      if (state.providerType !== 'walletconnect') {
        // Injected wallet
        const provider = providerRef.current;
        if (!provider) throw new Error('Wallet provider not available');

        const encodedMessage = new TextEncoder().encode(message);

        if (typeof provider.signMessage === 'function') {
          const result = await provider.signMessage(encodedMessage, 'utf8');
          // Convert Uint8Array to base58
          const bs58Module = await import('bs58');
          return bs58Module.default.encode(result.signature || result);
        }
        throw new Error('signMessage not supported by this wallet');
      }

      // WalletConnect path
      if (!signClientRef.current || !sessionRef.current) {
        throw new Error('WalletConnect session not available');
      }

      const bs58Module = await import('bs58');
      const encodedMessage = bs58Module.default.encode(new TextEncoder().encode(message));

      const result = await signClientRef.current.request({
        topic: sessionRef.current.topic,
        chainId: SOLANA_CHAINS.mainnet,
        request: {
          method: 'solana_signMessage',
          params: {
            message: encodedMessage,
            pubkey: state.address,
          },
        },
      });

      return (result as any)?.signature || null;
    },
    [state.address, state.providerType]
  );

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    wcUri,
    availableWallets,
  };
}
