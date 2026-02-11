import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import { RewardsDashboard } from "@/components/RewardsDashboard";
import { rewardsStorage } from "@/lib/rewardsStorage";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Award,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const { t } = useLanguage();
  const [rewardsState, setRewardsState] = useState(rewardsStorage.get());

  useEffect(() => {
    const interval = setInterval(() => {
      const current = rewardsStorage.get();
      if (JSON.stringify(current) !== JSON.stringify(rewardsState)) {
        setRewardsState(current);
      }
    }, 500); // Poll for changes since we don't have a global event bus yet
    return () => clearInterval(interval);
  }, [rewardsState]);

  const { isConnected, chain, address } = rewardsState;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to view your portfolio, trading history, and performance metrics."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
        <div className="relative h-[calc(100vh-64px)] overflow-hidden">
          <ComingSoonOverlay />
          <div className="pointer-events-none filter grayscale-[0.5] blur-[2px] opacity-20">
            <RewardsDashboard
              chain={chain}
              address={address}
            />
          </div>
        </div>
      )}
    </div>
  );
}
