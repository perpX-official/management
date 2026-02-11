import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { rewardsStorage, type RewardsState, type ChainKind } from '@/lib/rewardsStorage';

// Demo wallet address for demo mode
const DEMO_WALLET_ADDRESS = '0xDE286bcD39d0a6C106871e106871106871106871';

export function useRewardsState() {
  // Use WalletContext for ALL chain state (including EVM)
  // Do NOT use wagmi's useAccount directly - WalletContext handles EVM filtering
  const { address: walletAddress, activeChain, isConnected: walletConnected } = useWallet();
  
  // Check for demo mode
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('demoMode') === 'true';
    }
    return false;
  });
  
  const [state, setState] = useState<RewardsState>(() => {
    // Check demo mode first
    if (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true') {
      return {
        chain: 'evm' as ChainKind,
        chainType: 'evm' as const,
        address: DEMO_WALLET_ADDRESS,
        isConnected: true
      };
    }
    // Check active chain from WalletContext
    if (walletConnected && walletAddress && activeChain) {
      const chainKind: ChainKind = activeChain === 'sol' ? 'sol' : activeChain === 'tron' ? 'tron' : 'evm';
      const chainType = activeChain === 'sol' ? 'solana' as const : activeChain === 'tron' ? 'tron' as const : 'evm' as const;
      return { chain: chainKind, chainType, address: walletAddress, isConnected: true };
    }
    return { chain: null, chainType: null, address: null, isConnected: false };
  });

  // Listen for demo mode changes
  useEffect(() => {
    const checkDemoMode = () => {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      setIsDemoMode(demoMode);
    };
    
    // Check on mount and listen for storage changes
    checkDemoMode();
    window.addEventListener('storage', checkDemoMode);
    
    return () => window.removeEventListener('storage', checkDemoMode);
  }, []);

  // Sync state with wallet connections or demo mode
  useEffect(() => {
    // Demo mode takes priority
    if (isDemoMode) {
      const newState: RewardsState = {
        chain: 'evm' as ChainKind,
        chainType: 'evm' as const,
        address: DEMO_WALLET_ADDRESS,
        isConnected: true
      };
      setState(newState);
      rewardsStorage.set(newState);
      return;
    }
    
    // Use WalletContext state (already filters out unwanted EVM auto-connects)
    if (walletConnected && walletAddress && activeChain) {
      const chainKind: ChainKind = activeChain === 'sol' ? 'sol' : activeChain === 'tron' ? 'tron' : 'evm';
      const chainType = activeChain === 'sol' ? 'solana' as const : activeChain === 'tron' ? 'tron' as const : 'evm' as const;
      const newState: RewardsState = {
        chain: chainKind,
        chainType,
        address: walletAddress,
        isConnected: true
      };
      setState(newState);
      rewardsStorage.set(newState);
      return;
    }
    
    // Nothing connected
    const newState: RewardsState = { 
      chain: null, 
      chainType: null, 
      address: null, 
      isConnected: false 
    };
    setState(newState);
    // Only clear storage if we were previously connected
    const currentStorage = rewardsStorage.get();
    if (currentStorage.isConnected) {
      rewardsStorage.set(newState);
    }
  }, [walletConnected, walletAddress, activeChain, isDemoMode]);

  return state;
}
