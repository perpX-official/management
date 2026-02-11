import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { rewardsStorage, type ChainKind } from '@/lib/rewardsStorage';
import { useTronWallet } from '@/hooks/useTronWallet';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';

export type ActiveChain = 'evm' | 'tron' | 'sol' | null;

interface WalletContextType {
  // Unified state
  isConnected: boolean;
  address: string | null;
  activeChain: ActiveChain;
  chainName: string | null;
  isPending: boolean;

  // Actions
  connectEvm: (mode?: 'metamask' | 'walletconnect') => Promise<void>;
  connectTron: (mode?: 'auto' | 'tronlink' | 'walletconnect') => Promise<void>;
  connectSolana: (walletId?: string) => Promise<void>;
  disconnect: () => void;
  openChainSelect: () => void;

  // Chain select modal
  isChainSelectOpen: boolean;
  setChainSelectOpen: (open: boolean) => void;

  // Tron-specific
  tronWcUri: string | null;
  tronProviderType: string | null;

  // EVM-specific
  evmWcUri: string | null;

  // Solana-specific
  solanaWcUri: string | null;
  solanaWalletName: string | null;
  solanaAvailableWallets: Array<{ id: string; name: string; icon: string; available: boolean }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // EVM (wagmi only)
  const wagmiAccount = useAccount();
  const { connectAsync, connectors, isPending: evmConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const evmAddress = wagmiAccount.address || null;
  const evmConnected = wagmiAccount.isConnected;
  const evmConnectorId = wagmiAccount.connector?.id || null;
  const [evmWcUri, setEvmWcUri] = useState<string | null>(null);
  const intendedEvmConnectorIdRef = useRef<string | null>(null);
  const evmWcListenerRef = useRef<((uri: string) => void) | null>(null);

  // Tron
  const tron = useTronWallet();

  // Solana
  const solana = useSolanaWallet();

  // Chain select modal
  const [isChainSelectOpen, setChainSelectOpen] = useState(false);

  // Track which chain the user INTENDS to use.
  // Used to prevent EVM auto-connect interference when the user chooses Tron/Solana.
  const [activeChain, setActiveChain] = useState<ActiveChain>(null);
  const [intendedChain, setIntendedChain] = useState<ActiveChain>(null);

  // Force-disconnect EVM if it connects while the user intended Tron/Solana.
  useEffect(() => {
    if (evmConnected && (intendedChain === 'tron' || intendedChain === 'sol')) {
      console.log('[WalletContext] Blocking EVM auto-connect while on Tron/Solana, disconnecting...');
      wagmiDisconnect();
      return;
    }
  }, [evmConnected, intendedChain, wagmiDisconnect]);

  // Ensure we only keep the intended EVM connector (MetaMask or WalletConnect).
  useEffect(() => {
    if (!evmConnected || intendedChain !== 'evm') return;
    const intendedId = intendedEvmConnectorIdRef.current;
    if (intendedId && evmConnectorId && evmConnectorId !== intendedId) {
      console.log('[WalletContext] EVM connector mismatch, disconnecting unexpected connector:', evmConnectorId);
      wagmiDisconnect();
    }
  }, [evmConnected, evmConnectorId, intendedChain, wagmiDisconnect]);

  // Determine unified state
  const isPending = tron.isPending || solana.isPending || evmConnecting;

  const effectiveEvmConnected = evmConnected && intendedChain === 'evm';
  const isConnected = effectiveEvmConnected || tron.isConnected || solana.isConnected;

  let address: string | null = null;
  let chainName: string | null = null;

  if (activeChain === 'evm' && effectiveEvmConnected && evmAddress) {
    address = evmAddress;
    chainName = 'EVM';
  } else if (activeChain === 'tron' && tron.isConnected && tron.address) {
    address = tron.address;
    chainName = tron.chainName || 'Tron';
  } else if (activeChain === 'sol' && solana.isConnected && solana.address) {
    address = solana.address;
    chainName = solana.walletName || 'Solana';
  } else if (effectiveEvmConnected && evmAddress && !tron.isConnected && !solana.isConnected) {
    address = evmAddress;
    chainName = 'EVM';
  } else if (tron.isConnected && tron.address) {
    address = tron.address;
    chainName = tron.chainName || 'Tron';
  } else if (solana.isConnected && solana.address) {
    address = solana.address;
    chainName = solana.walletName || 'Solana';
  }

  // Sync active chain based on connection state
  // But respect the intended chain to prevent wagmi autoConnect interference
  useEffect(() => {
    if (intendedChain === 'tron' && tron.isConnected) {
      setActiveChain('tron');
    } else if (intendedChain === 'sol' && solana.isConnected) {
      setActiveChain('sol');
    } else if (intendedChain === 'evm' && effectiveEvmConnected && evmAddress) {
      setActiveChain('evm');
    } else if (tron.isConnected) {
      setActiveChain('tron');
    } else if (solana.isConnected) {
      setActiveChain('sol');
    } else if (effectiveEvmConnected && evmAddress) {
      setActiveChain('evm');
    } else {
      setActiveChain(null);
    }
  }, [effectiveEvmConnected, evmAddress, tron.isConnected, solana.isConnected, intendedChain]);

  // Sync with rewardsStorage
  useEffect(() => {
    if (isConnected && address && activeChain) {
      const chainKind: ChainKind = activeChain === 'sol' ? 'sol' : activeChain === 'tron' ? 'tron' : 'evm';
      const chainType = activeChain === 'sol' ? 'solana' as const : activeChain === 'tron' ? 'tron' as const : 'evm' as const;
      rewardsStorage.set({
        chain: chainKind,
        chainType,
        address,
        isConnected: true,
      });
      rewardsStorage.initUser(address, chainKind);
    } else if (!isConnected) {
      const currentState = rewardsStorage.get();
      if (currentState.isConnected) {
        rewardsStorage.set({
          chain: null,
          chainType: null,
          address: null,
          isConnected: false,
        });
      }
    }
  }, [isConnected, address, activeChain]);

  // Connect functions
  const connectEvm = useCallback(
    async (mode: 'metamask' | 'walletconnect' = 'metamask') => {
      setIntendedChain('evm');
      // Disconnect other chains first
      if (tron.isConnected) tron.disconnect();
      if (solana.isConnected) solana.disconnect();

      const metaMaskConnector = connectors.find(c => c.id === 'metaMask' || c.name === 'MetaMask');
      const walletConnectConnector = connectors.find(c => c.id === 'walletConnect' || c.name === 'WalletConnect');

      const targetConnector = mode === 'walletconnect' ? walletConnectConnector : metaMaskConnector;
      if (!targetConnector) {
        throw new Error(mode === 'walletconnect' ? 'WalletConnect not available' : 'MetaMask not available');
      }

      intendedEvmConnectorIdRef.current = targetConnector.id;

      if (mode === 'walletconnect') {
        setEvmWcUri(null);
        try {
          const provider: any = await targetConnector.getProvider();
          if (provider?.on) {
            const handler = (uri: string) => setEvmWcUri(uri);
            evmWcListenerRef.current = handler;
            provider.on('display_uri', handler);
          }
        } catch {
          // ignore
        }
      }

      await connectAsync({ connector: targetConnector });

      // Cleanup display_uri listener and QR once connected
      if (mode === 'walletconnect') {
        try {
          const provider: any = await targetConnector.getProvider();
          if (provider?.off && evmWcListenerRef.current) {
            provider.off('display_uri', evmWcListenerRef.current);
          }
        } catch {
          // ignore
        }
        evmWcListenerRef.current = null;
        setEvmWcUri(null);
      }
    },
    [connectAsync, connectors, tron, solana]
  );

  const connectTron = useCallback(
    async (mode?: 'auto' | 'tronlink' | 'walletconnect') => {
      // Set intended chain BEFORE connecting
      setIntendedChain('tron');
      // Disconnect EVM first
      if (evmConnected) {
        wagmiDisconnect();
      }
      if (solana.isConnected) {
        await solana.disconnect();
      }
      // Small delay to ensure wagmi disconnect completes
      await new Promise(resolve => setTimeout(resolve, 150));
      await tron.connect(mode);
    },
    [evmConnected, wagmiDisconnect, solana, tron]
  );

  const connectSolana = useCallback(
    async (walletId?: string) => {
      // Set intended chain BEFORE connecting
      setIntendedChain('sol');
      // Disconnect EVM first
      if (evmConnected) {
        wagmiDisconnect();
      }
      if (tron.isConnected) {
        await tron.disconnect();
      }
      // Small delay to ensure wagmi disconnect completes
      await new Promise(resolve => setTimeout(resolve, 150));
      await solana.connect(walletId);
    },
    [evmConnected, wagmiDisconnect, tron, solana]
  );

  const disconnect = useCallback(() => {
    setIntendedChain(null);
    if (evmConnected) {
      wagmiDisconnect();
    }
    if (tron.isConnected) tron.disconnect();
    if (solana.isConnected) solana.disconnect();
    setEvmWcUri(null);
    intendedEvmConnectorIdRef.current = null;
    rewardsStorage.set({
      chain: null,
      chainType: null,
      address: null,
      isConnected: false,
    });
  }, [evmConnected, wagmiDisconnect, tron, solana]);

  const openChainSelect = useCallback(() => {
    setChainSelectOpen(true);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        activeChain,
        chainName,
        isPending,
        connectEvm,
        connectTron,
        connectSolana,
        disconnect,
        openChainSelect,
        isChainSelectOpen,
        setChainSelectOpen,
        evmWcUri,
        tronWcUri: tron.wcUri,
        tronProviderType: tron.providerType,
        solanaWcUri: solana.wcUri,
        solanaWalletName: solana.walletName,
        solanaAvailableWallets: solana.availableWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
