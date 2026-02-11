import { useState, useCallback, useRef, useEffect } from 'react';
import type SignClient from '@walletconnect/sign-client';
import { getWalletConnectClient } from '@/lib/walletConnectClient';
import {
  TRON_CHAINS,
  TRON_CHAIN_NAMES,
  TRON_FULL_NODES,
  isMobileDevice,
  TRON_MOBILE_WALLETS,
} from '@/config/walletConstants';

export type TronProviderType = 'walletconnect' | 'extension' | null;

export interface TronWalletState {
  address: string | null;
  chainId: string | null;
  chainName: string | null;
  isConnected: boolean;
  providerType: TronProviderType;
  isPending: boolean;
  error: string | null;
}

interface UseTronWalletReturn extends TronWalletState {
  connect: (mode?: 'auto' | 'tronlink' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  wcUri: string | null;
}

// Extend Window for TronLink
declare global {
  interface Window {
    tronLink?: {
      request: (args: { method: string }) => Promise<any>;
      ready?: boolean;
      tronWeb?: any;
    };
    tronWeb?: any;
  }
}

export function useTronWallet(): UseTronWalletReturn {
  const [state, setState] = useState<TronWalletState>({
    address: null,
    chainId: null,
    chainName: null,
    isConnected: false,
    providerType: null,
    isPending: false,
    error: null,
  });
  const [wcUri, setWcUri] = useState<string | null>(null);
  const signClientRef = useRef<SignClient | null>(null);
  const sessionRef = useRef<any>(null);
  const approvalRef = useRef<Promise<any> | null>(null);

  const getTronWeb = () => {
    return window.tronWeb || window.tronLink?.tronWeb || null;
  };

  const hasTronExtension = () => {
    return typeof window !== 'undefined' && (!!window.tronLink || !!window.tronWeb);
  };

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

  // Connect via browser extension (TronLink under the hood, but UI should say "Browser Extension")
  const connectExtension = useCallback(async () => {
    setState((prev) => ({ ...prev, isPending: true, error: null }));
    setWcUri(null);

    if (!hasTronExtension()) {
      const err = new Error('Browser extension not detected. Please install a Tron-compatible extension.');
      setState((prev) => ({ ...prev, isPending: false, error: err.message }));
      throw err;
    }

    try {
      if (window.tronLink?.request) {
        await window.tronLink.request({ method: 'tron_requestAccounts' });
      }

      // Wait briefly for tronWeb to populate
      let tronWeb = getTronWeb();
      let address = tronWeb?.defaultAddress?.base58;
      for (let i = 0; i < 10 && !address; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        tronWeb = getTronWeb();
        address = tronWeb?.defaultAddress?.base58;
      }

      if (!tronWeb || !address) {
        throw new Error('Failed to read address from extension');
      }

      // Try to infer chain from full node host
      const nodeHost = tronWeb.fullNode?.host || '';
      const chainId =
        Object.entries(TRON_FULL_NODES).find(([, host]) => nodeHost.startsWith(host))?.[0] ||
        TRON_CHAINS.mainnet;

      setState({
        address,
        chainId,
        chainName: TRON_CHAIN_NAMES[chainId] || 'Tron',
        isConnected: true,
        providerType: 'extension',
        isPending: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isPending: false,
        error: err?.message || 'Extension connection failed',
      }));
      throw err;
    }
  }, []);

  // Connect via WalletConnect v2
  // This creates a URI for QR code display and waits for approval in background
  const connectWalletConnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isPending: true, error: null }));

    try {
      const client = await getWalletConnectClient();
      signClientRef.current = client;

      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          tron: {
            chains: [TRON_CHAINS.mainnet],
            methods: [
              'tron_signMessage',
              'tron_signTransaction',
              'tron_sign',
            ],
            events: [],
          },
        },
      });

      if (uri) {
        setWcUri(uri);

        // On mobile, try to open wallet app
        if (isMobileDevice()) {
          const wallet = TRON_MOBILE_WALLETS[0]; // Trust Wallet as default
          if (wallet) {
            const encodedUri = encodeURIComponent(uri);
            window.location.href = `${wallet.deepLink}?uri=${encodedUri}`;
          }
        }
      }

      // Store approval promise and wait for it
      approvalRef.current = approval();
      const session = await approvalRef.current;
      sessionRef.current = session;
      setWcUri(null);
      approvalRef.current = null;

      // Extract address from session
      const accounts = session.namespaces?.tron?.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No Tron accounts found in WalletConnect session');
      }

      // Format: "tron:0x2b6653dc:TAddress"
      const parts = accounts[0].split(':');
      const address = parts[parts.length - 1];
      const chainId = parts.slice(0, 2).join(':');

      setState({
        address,
        chainId,
        chainName: TRON_CHAIN_NAMES[chainId] || 'Unknown',
        isConnected: true,
        providerType: 'walletconnect',
        isPending: false,
        error: null,
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
    async (mode: 'auto' | 'tronlink' | 'walletconnect' = 'auto') => {
      setState((prev) => ({ ...prev, isPending: true, error: null }));
      try {
        if (mode === 'tronlink') {
          await connectExtension();
          return;
        }
        if (mode === 'walletconnect') {
          await connectWalletConnect();
          return;
        }
        // Auto: prefer extension on desktop, fallback to WalletConnect
        if (hasTronExtension() && !isMobileDevice()) {
          await connectExtension();
          return;
        }
        await connectWalletConnect();
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isPending: false,
          error: err?.message || 'Connection failed',
        }));
        throw err;
      }
    },
    [connectWalletConnect]
  );

  // Disconnect
  const disconnect = useCallback(async () => {
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
    approvalRef.current = null;
    setWcUri(null);
    setState({
      address: null,
      chainId: null,
      chainName: null,
      isConnected: false,
      providerType: null,
      isPending: false,
      error: null,
    });
  }, []);

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!state.address || !state.providerType) {
        throw new Error('Not connected');
      }

      if (state.providerType === 'extension') {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available');

        // Use signMessageV2 (recommended by TronLink docs)
        const signFn =
          tronWeb.trx?.signMessageV2 || tronWeb.trx?.signMessage;
        if (typeof signFn !== 'function') {
          throw new Error('TronWeb sign method not available');
        }
        const signature = await signFn.call(tronWeb.trx, message);
        return signature;
      }

      // WalletConnect path
      if (!signClientRef.current || !sessionRef.current) {
        throw new Error('WalletConnect session not available');
      }

      const result = await signClientRef.current.request({
        topic: sessionRef.current.topic,
        chainId: state.chainId || TRON_CHAINS.mainnet,
        request: {
          method: 'tron_signMessage',
          params: { message, address: state.address },
        },
      });

      return typeof result === 'string' ? result : (result as any)?.signature || null;
    },
    [state.address, state.providerType, state.chainId]
  );

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    wcUri,
  };
}
