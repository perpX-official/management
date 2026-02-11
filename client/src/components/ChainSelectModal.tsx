import React, { useState, useEffect, useRef, useCallback } from "react";
import { Wallet, Zap, Globe, Loader2, X, Copy, Check, AlertTriangle, LogOut } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import QRCode from "qrcode";

type ModalView =
  | "chains"
  | "switch_confirm"
  | "evm_wallets"
  | "evm_wc_qr"
  | "tron_wallets"
  | "tron_wc_qr"
  | "solana_wallets"
  | "wc_qr";

// Base Tron wallet options to display
const TRON_WALLET_OPTIONS_BASE = [
  {
    id: "walletconnect",
    name: "WalletConnect",
    subLabel: "Scan QR code with any Tron wallet",
    icon: (
      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.09 10.08C9.37 6.84 14.63 6.84 17.91 10.08L18.28 10.44C18.44 10.6 18.44 10.86 18.28 11.02L16.95 12.32C16.87 12.4 16.74 12.4 16.66 12.32L16.15 11.82C13.86 9.57 10.14 9.57 7.85 11.82L7.31 12.35C7.23 12.43 7.1 12.43 7.02 12.35L5.69 11.05C5.53 10.89 5.53 10.63 5.69 10.47L6.09 10.08ZM20.67 12.8L21.85 13.95C22.01 14.11 22.01 14.37 21.85 14.53L16.44 19.82C16.28 19.98 16.02 19.98 15.86 19.82L12.16 16.19C12.12 16.15 12.06 16.15 12.02 16.19L8.32 19.82C8.16 19.98 7.9 19.98 7.74 19.82L2.15 14.53C1.99 14.37 1.99 14.11 2.15 13.95L3.33 12.8C3.49 12.64 3.75 12.64 3.91 12.8L7.61 16.43C7.65 16.47 7.71 16.47 7.75 16.43L11.45 12.8C11.61 12.64 11.87 12.64 12.03 12.8L15.73 16.43C15.77 16.47 15.83 16.47 15.87 16.43L19.57 12.8C19.73 12.64 19.99 12.64 20.15 12.8L20.67 12.8Z" fill="#3B99FC" />
        </svg>
      </div>
    ),
  },
  {
    id: "trust",
    name: "Trust Wallet",
    subLabel: "Mobile wallet",
    icon: <span className="text-xl">🛡️</span>,
  },
  {
    id: "safepal",
    name: "SafePal",
    subLabel: "Mobile wallet",
    icon: <span className="text-xl">🔐</span>,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    subLabel: "Mobile wallet",
    icon: <span className="text-xl">⭕</span>,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    subLabel: "Mobile wallet",
    icon: <span className="text-xl">💎</span>,
  },
];

export function ChainSelectModal() {
  const {
    isChainSelectOpen,
    setChainSelectOpen,
    isConnected,
    activeChain,
    address,
    chainName,
    connectEvm,
    connectTron,
    connectSolana,
    disconnect,
    isPending,
    tronWcUri,
    evmWcUri,
    solanaWcUri,
    solanaAvailableWallets,
  } = useWallet();

  const hasTronExtension =
    typeof window !== "undefined" && (!!(window as any).tronLink || !!(window as any).tronWeb);

  const tronWalletOptions = React.useMemo(() => {
    const options = [...TRON_WALLET_OPTIONS_BASE];
    if (hasTronExtension) {
      options.unshift({
        id: "extension",
        name: "Browser Extension",
        subLabel: "Connect with desktop extension",
        icon: <span className="text-xl">🧩</span>,
      });
    }
    return options;
  }, [hasTronExtension]);

  const [view, setView] = useState<ModalView>("chains");
  const [connecting, setConnecting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingSwitchChain, setPendingSwitchChain] = useState<'evm' | 'tron' | 'sol' | null>(null);

  // Generate QR code when URI changes
  const activeUri =
    view === "evm_wc_qr"
      ? evmWcUri
      : view === "tron_wc_qr"
      ? tronWcUri
      : view === "wc_qr"
      ? solanaWcUri
      : null;
  useEffect(() => {
    if (activeUri && (view === "evm_wc_qr" || view === "tron_wc_qr" || view === "wc_qr")) {
      QRCode.toDataURL(activeUri, {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [activeUri, view]);

  // If Solana WalletConnect URI is generated, switch to QR view automatically
  useEffect(() => {
    if (view === "solana_wallets" && solanaWcUri) {
      setView("wc_qr");
      setConnecting(false);
    }
  }, [solanaWcUri, view]);

  // Reset state when modal opens
  useEffect(() => {
    if (isChainSelectOpen) {
      setView("chains");
      setConnecting(false);
      setQrDataUrl(null);
      setCopied(false);
      setPendingSwitchChain(null);
    }
  }, [isChainSelectOpen]);

  if (!isChainSelectOpen) return null;

  const handleClose = () => {
    setChainSelectOpen(false);
    setView("chains");
    setConnecting(false);
    setQrDataUrl(null);
    setCopied(false);
    setPendingSwitchChain(null);
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get chain display name
  const getChainDisplayName = (chain: string) => {
    switch (chain) {
      case 'evm': return 'EVM';
      case 'tron': return 'Tron';
      case 'sol': return 'Solana';
      default: return chain;
    }
  };

  // Handle chain button click with switch confirmation
  const handleChainClick = (targetChain: 'evm' | 'tron' | 'sol') => {
    // If already connected to a different chain, show switch confirmation
    if (isConnected && activeChain && activeChain !== targetChain) {
      setPendingSwitchChain(targetChain);
      setView("switch_confirm");
      return;
    }

    // Not connected or same chain - proceed directly
    proceedWithConnection(targetChain);
  };

  // Proceed with actual connection after confirmation
  const proceedWithConnection = (targetChain: 'evm' | 'tron' | 'sol') => {
    setPendingSwitchChain(null);
    switch (targetChain) {
      case 'evm':
        setView("evm_wallets");
        break;
      case 'tron':
        // Show Tron wallet list instead of auto-connecting
        setView("tron_wallets");
        break;
      case 'sol':
        handleSolanaSelect();
        break;
    }
  };

  // Confirm chain switch
  const handleConfirmSwitch = () => {
    if (pendingSwitchChain) {
      proceedWithConnection(pendingSwitchChain);
    }
  };

  const handleEvmMetaMask = async () => {
    setConnecting(true);
    try {
      await connectEvm("metamask");
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || "MetaMask connection failed");
      setConnecting(false);
    }
  };

  const handleEvmWalletConnect = async () => {
    setConnecting(true);
    setView("evm_wc_qr");
    try {
      await connectEvm("walletconnect");
      handleClose();
    } catch (err: any) {
      if (evmWcUri) {
        setConnecting(false);
      } else {
        toast.error(err?.message || "WalletConnect connection failed");
        setView("evm_wallets");
        setConnecting(false);
      }
    }
  };

  const handleTronExtensionConnect = async () => {
    setConnecting(true);
    try {
      await connectTron("tronlink");
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || "Tron connection failed");
      setConnecting(false);
    }
  };

  // Tron: connect via WalletConnect (show QR code)
  const handleTronWalletConnect = async () => {
    setConnecting(true);
    setView("tron_wc_qr");
    try {
      await connectTron("walletconnect");
      handleClose();
    } catch (err: any) {
      // If WalletConnect URI was generated, stay on QR view
      if (tronWcUri) {
        setConnecting(false);
      } else {
        toast.error(err?.message || "Tron connection failed");
        setView("tron_wallets");
        setConnecting(false);
      }
    }
  };

  // Tron: handle wallet option click
  const handleTronWalletClick = (walletId: string) => {
    if (walletId === "extension") {
      handleTronExtensionConnect();
      return;
    }
    // All other wallets connect via WalletConnect (QR / mobile deep link)
    handleTronWalletConnect();
  };

  // Solana: show available wallets
  const handleSolanaSelect = () => {
    setView("solana_wallets");
  };

  const handleSolanaConnect = async (walletId: string) => {
    setConnecting(true);
    try {
      await connectSolana(walletId);
      handleClose();
    } catch (err: any) {
      // If WalletConnect URI was generated, show QR
      if (solanaWcUri) {
        setView("wc_qr");
        setConnecting(false);
      } else {
        toast.error(err?.message || "Solana connection failed");
        setConnecting(false);
      }
    }
  };

  const handleCopyUri = async () => {
    const uri = activeUri;
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      toast.success("URI copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    handleClose();
  };

  // Determine which wallets are detected for Solana
  const detectedSolanaWallets = solanaAvailableWallets.filter(
    (w) => w.available
  );
  const undetectedSolanaWallets = solanaAvailableWallets.filter(
    (w) => !w.available
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {view !== "chains" && view !== "switch_confirm" && (
              <button
                className="rounded-full p-1.5 hover:bg-white/10 transition text-white/60 hover:text-white"
                onClick={() => {
                  setView("chains");
                  setConnecting(false);
                  setQrDataUrl(null);
                  setPendingSwitchChain(null);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {view === "chains" && (isConnected ? "Wallet" : "Connect Wallet")}
              {view === "switch_confirm" && "Switch Chain"}
              {view === "evm_wallets" && "EVM Wallets"}
              {view === "evm_wc_qr" && "Scan QR Code"}
              {view === "tron_wallets" && "Tron Network"}
              {view === "tron_wc_qr" && "Scan QR Code"}
              {view === "solana_wallets" && "Solana"}
              {view === "wc_qr" && "Scan QR Code"}
            </h2>
          </div>
          <button
            className="rounded-full p-2 hover:bg-white/10 transition text-white/60 hover:text-white"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===== Chain Selection View ===== */}
        {view === "chains" && (
          <div className="space-y-3">
            {/* Show current connection status */}
            {isConnected && address && activeChain && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activeChain === 'evm' ? 'bg-blue-500' : 
                      activeChain === 'tron' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Connected to {getChainDisplayName(activeChain)}
                      </div>
                      <div className="text-xs text-white/50 font-mono">
                        {formatAddress(address)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {isConnected && (
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1">
                Switch to another chain
              </p>
            )}

            <ChainButton
              label="EVM Wallets"
              subLabel="MetaMask, WalletConnect"
              icon={<Globe className="w-6 h-6 text-blue-400" />}
              onClick={() => handleChainClick('evm')}
              active={activeChain === 'evm'}
            />
            <ChainButton
              label="Tron Network"
              subLabel="Browser Extension, WalletConnect"
              icon={<Zap className="w-6 h-6 text-red-500" />}
              onClick={() => handleChainClick('tron')}
              active={activeChain === 'tron'}
            />
            <ChainButton
              label="Solana"
              subLabel="Phantom, Solflare, Backpack"
              icon={<Wallet className="w-6 h-6 text-purple-400" />}
              onClick={() => handleChainClick('sol')}
              active={activeChain === 'sol'}
            />
          </div>
        )}

        {/* ===== Switch Chain Confirmation View ===== */}
        {view === "switch_confirm" && pendingSwitchChain && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-white/80">
                You are currently connected to{" "}
                <span className="font-bold text-white">{getChainDisplayName(activeChain!)}</span>.
              </p>
              <p className="text-sm text-white/80">
                Switch to{" "}
                <span className="font-bold text-white">{getChainDisplayName(pendingSwitchChain)}</span>?
              </p>
              <p className="text-xs text-white/40">
                Your current connection will be disconnected. Points will be automatically linked.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setPendingSwitchChain(null);
                  setView("chains");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSwitch}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition text-sm font-medium"
              >
                Switch
              </button>
            </div>
          </div>
        )}

        {/* ===== EVM Wallet List View ===== */}
        {view === "evm_wallets" && (
          <div className="space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1">
              Select a wallet to connect
            </p>
            <ChainButton
              label="MetaMask"
              subLabel="Browser Extension"
              icon={<span className="text-xl">🦊</span>}
              onClick={handleEvmMetaMask}
            />
            <ChainButton
              label="WalletConnect"
              subLabel="Scan QR code with mobile wallet"
              icon={
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.09 10.08C9.37 6.84 14.63 6.84 17.91 10.08L18.28 10.44C18.44 10.6 18.44 10.86 18.28 11.02L16.95 12.32C16.87 12.4 16.74 12.4 16.66 12.32L16.15 11.82C13.86 9.57 10.14 9.57 7.85 11.82L7.31 12.35C7.23 12.43 7.1 12.43 7.02 12.35L5.69 11.05C5.53 10.89 5.53 10.63 5.69 10.47L6.09 10.08ZM20.67 12.8L21.85 13.95C22.01 14.11 22.01 14.37 21.85 14.53L16.44 19.82C16.28 19.98 16.02 19.98 15.86 19.82L12.16 16.19C12.12 16.15 12.06 16.15 12.02 16.19L8.32 19.82C8.16 19.98 7.9 19.98 7.74 19.82L2.15 14.53C1.99 14.37 1.99 14.11 2.15 13.95L3.33 12.8C3.49 12.64 3.75 12.64 3.91 12.8L7.61 16.43C7.65 16.47 7.71 16.47 7.75 16.43L11.45 12.8C11.61 12.64 11.87 12.64 12.03 12.8L15.73 16.43C15.77 16.47 15.83 16.47 15.87 16.43L19.57 12.8C19.73 12.64 19.99 12.64 20.15 12.8L20.67 12.8Z" fill="#3B99FC" />
                  </svg>
                </div>
              }
              onClick={handleEvmWalletConnect}
            />
          </div>
        )}

        {/* ===== EVM WalletConnect QR View ===== */}
        {view === "evm_wc_qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-white/60 text-center">
              Scan with your EVM wallet app
            </p>
            {evmWcUri && qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl">
                <img
                  src={qrDataUrl}
                  alt="WalletConnect QR"
                  className="w-56 h-56"
                />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-white/5 rounded-xl">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            )}
            {activeUri && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyUri}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm text-white/70"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied" : "Copy URI"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== Tron Wallet List View ===== */}
        {view === "tron_wallets" && (
          <div className="space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1">
              Select a wallet to connect
            </p>

            {tronWalletOptions.map((wallet) => (
              <ChainButton
                key={wallet.id}
                label={wallet.name}
                subLabel={wallet.subLabel}
                icon={wallet.icon}
                onClick={() => handleTronWalletClick(wallet.id)}
              />
            ))}

            <p className="text-xs text-white/30 text-center mt-2">
              Choose browser extension or scan the QR code with your Tron-compatible wallet app.
            </p>
          </div>
        )}

        {/* ===== Tron WalletConnect QR View ===== */}
        {view === "tron_wc_qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-white/60 text-center">
              Scan with your Tron-compatible wallet
            </p>
            {tronWcUri && qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl">
                <img
                  src={qrDataUrl}
                  alt="WalletConnect QR"
                  className="w-56 h-56"
                />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-white/5 rounded-xl">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            )}
            {activeUri && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyUri}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm text-white/70"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied" : "Copy URI"}
                </button>
              </div>
            )}
            <p className="text-xs text-white/30 text-center">
              Supported: Trust Wallet, SafePal, OKX, Bitget and other Tron wallets
            </p>
          </div>
        )}

        {/* ===== Solana Wallets View ===== */}
        {view === "solana_wallets" && (
          <div className="space-y-3">
            {/* Detected wallets first */}
            {detectedSolanaWallets.length > 0 && (
              <>
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1">
                  Detected
                </p>
                {detectedSolanaWallets.map((wallet) => (
                  <ChainButton
                    key={wallet.id}
                    label={wallet.name}
                    subLabel="Click to connect"
                    icon={<span className="text-xl">{wallet.icon}</span>}
                    onClick={() => handleSolanaConnect(wallet.id)}
                    badge="Available"
                  />
                ))}
              </>
            )}

            {/* Not detected wallets */}
            {undetectedSolanaWallets.length > 0 && (
              <>
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium px-1 mt-2">
                  Not Detected
                </p>
                {undetectedSolanaWallets.map((wallet) => (
                  <ChainButton
                    key={wallet.id}
                    label={wallet.name}
                    subLabel="Extension not installed"
                    icon={<span className="text-xl opacity-50">{wallet.icon}</span>}
                    onClick={() => handleSolanaConnect(wallet.id)}
                    disabled={true}
                  />
                ))}
              </>
            )}

            {/* WalletConnect option for mobile */}
            <div className="pt-2 border-t border-white/5">
              <ChainButton
                label="WalletConnect"
                subLabel="Connect via QR code (mobile wallets)"
                icon={
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.09 10.08C9.37 6.84 14.63 6.84 17.91 10.08L18.28 10.44C18.44 10.6 18.44 10.86 18.28 11.02L16.95 12.32C16.87 12.4 16.74 12.4 16.66 12.32L16.15 11.82C13.86 9.57 10.14 9.57 7.85 11.82L7.31 12.35C7.23 12.43 7.1 12.43 7.02 12.35L5.69 11.05C5.53 10.89 5.53 10.63 5.69 10.47L6.09 10.08ZM20.67 12.8L21.85 13.95C22.01 14.11 22.01 14.37 21.85 14.53L16.44 19.82C16.28 19.98 16.02 19.98 15.86 19.82L12.16 16.19C12.12 16.15 12.06 16.15 12.02 16.19L8.32 19.82C8.16 19.98 7.9 19.98 7.74 19.82L2.15 14.53C1.99 14.37 1.99 14.11 2.15 13.95L3.33 12.8C3.49 12.64 3.75 12.64 3.91 12.8L7.61 16.43C7.65 16.47 7.71 16.47 7.75 16.43L11.45 12.8C11.61 12.64 11.87 12.64 12.03 12.8L15.73 16.43C15.77 16.47 15.83 16.47 15.87 16.43L19.57 12.8C19.73 12.64 19.99 12.64 20.15 12.8L20.67 12.8Z"
                        fill="#3B99FC"
                      />
                    </svg>
                  </div>
                }
                onClick={() => handleSolanaConnect("walletconnect")}
              />
            </div>

            {detectedSolanaWallets.length === 0 && (
              <p className="text-xs text-white/30 text-center mt-2">
                No Solana wallets detected. Install Phantom, Solflare, or
                Backpack, or use WalletConnect.
              </p>
            )}
          </div>
        )}

        {/* ===== WalletConnect QR View (Solana fallback) ===== */}
        {view === "wc_qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-white/60 text-center">
              Scan with your Solana wallet app
            </p>
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl">
                <img
                  src={qrDataUrl}
                  alt="WalletConnect QR"
                  className="w-56 h-56"
                />
              </div>
            ) : solanaWcUri ? (
              <div className="w-56 h-56 flex items-center justify-center bg-white/5 rounded-xl">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                <p className="text-sm text-white/60">
                  Initializing WalletConnect...
                </p>
              </div>
            )}
            {activeUri && (
              <button
                onClick={handleCopyUri}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm text-white/70"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy URI"}
              </button>
            )}
          </div>
        )}

        {/* Loading overlay for connecting state */}
        {connecting && view !== "tron_wc_qr" && view !== "wc_qr" && view !== "switch_confirm" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-white/70">Connecting...</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            By connecting your wallet, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChainButton(props: {
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
        props.active
          ? "bg-primary/10 border-primary/50"
          : props.disabled
          ? "bg-white/[0.02] opacity-50 cursor-not-allowed border-white/10"
          : "bg-white/5 hover:bg-white/10 hover:border-primary/50 border-white/10"
      }`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center w-12 h-12">
          {props.icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-white group-hover:text-primary transition-colors">
            {props.label}
          </div>
          <div className="text-sm text-white/40">{props.subLabel}</div>
        </div>
        {props.active && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
            Connected
          </span>
        )}
        {props.badge && !props.active && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            {props.badge}
          </span>
        )}
      </div>
    </button>
  );
}
