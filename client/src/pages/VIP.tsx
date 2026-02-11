import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Check, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface TierDetails {
  nameKey: string;
  fee: string;
  volume: string;
  benefitKeys: string[];
  allBenefits: string[];
}

export default function VIP() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();
  const [selectedTier, setSelectedTier] = useState<TierDetails | null>(null);

  const tiers: TierDetails[] = [
    { 
      nameKey: "vip.silver", 
      fee: "0.08%", 
      volume: "$100K+", 
      benefitKeys: ["vip.prioritySupportBenefit", "vip.reducedFees", "vip.earlyAccess"],
      allBenefits: [
        "vip.prioritySupportBenefit",
        "vip.reducedFees",
        "vip.earlyAccess",
        "vip.silverBadge",
        "vip.monthlyReports",
        "vip.tradingInsights"
      ]
    },
    { 
      nameKey: "vip.gold", 
      fee: "0.06%", 
      volume: "$1M+", 
      benefitKeys: ["vip.allSilverBenefits", "vip.dedicatedAccountManager", "vip.customApiLimits"],
      allBenefits: [
        "vip.allSilverBenefits",
        "vip.dedicatedAccountManager",
        "vip.customApiLimits",
        "vip.goldBadge",
        "vip.priorityWithdrawals",
        "vip.advancedAnalytics",
        "vip.customTradingTools"
      ]
    },
    { 
      nameKey: "vip.platinum", 
      fee: "0.04%", 
      volume: "$10M+", 
      benefitKeys: ["vip.allGoldBenefits", "vip.zeroMakerFees", "vip.exclusiveEvents"],
      allBenefits: [
        "vip.allGoldBenefits",
        "vip.zeroMakerFees",
        "vip.exclusiveEvents",
        "vip.platinumBadge",
        "vip.personalizedSupport",
        "vip.earlyProductAccess",
        "vip.customLiquidity",
        "vip.directTeamAccess"
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to view your VIP status and exclusive benefits."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('vip.title')}</h1>
          <p className="text-white/60">{t('vip.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier, index) => (
            <div key={index} className="glass-card rounded-xl p-6 hover-reveal">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-white">{t(tier.nameKey)}</h3>
              </div>
              <div className="mb-4">
                <div className="text-3xl font-bold text-primary mb-1">{tier.fee}</div>
                <div className="text-sm text-white/60">{t('vip.tradingFee')}</div>
              </div>
              <div className="mb-6">
                <div className="text-sm text-white/60 mb-1">{t('vip.volumeRequired')}</div>
                <div className="text-lg font-bold text-white">{tier.volume}</div>
              </div>
              <div className="space-y-2 mb-6">
                {tier.benefitKeys.map((benefitKey, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="h-4 w-4 text-green-500" />
                    {t(benefitKey)}
                  </div>
                ))}
              </div>
              <Button 
                className="w-full neuro-button micro-bounce text-white font-medium"
                onClick={() => setSelectedTier(tier)}
              >
                {t('home.learnMore')}
              </Button>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-8 text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('vip.currentTier')}: {t('vip.standard')}</h2>
          <p className="text-white/60 mb-6">{t('vip.unlockMessage')}</p>
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>$45,230 / $100,000</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" style={{width: "45%"}}></div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* VIP Tier Details Modal */}
      <Dialog open={!!selectedTier} onOpenChange={() => setSelectedTier(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-primary" />
              {selectedTier && t(selectedTier.nameKey)}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {selectedTier && (
                <div className="mt-2">
                  <div className="text-3xl font-bold text-primary mb-1">{selectedTier.fee}</div>
                  <div className="text-sm">{t('vip.tradingFee')}</div>
                  <div className="mt-2 text-sm">{t('vip.volumeRequired')}: <span className="font-bold text-white">{selectedTier.volume}</span></div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-white">{t('vip.allBenefits')}</h3>
            <div className="space-y-3">
              {selectedTier?.allBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">{t(benefit)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-white/80">
              {t('vip.upgradeMessage')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

