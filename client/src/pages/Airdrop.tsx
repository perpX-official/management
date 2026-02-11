import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Gift, Check, X, Wallet } from "lucide-react";
import { useState } from "react";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";

interface AirdropRound {
  round: number;
  title: string;
  totalAmount: string;
  eligibleUsers: number;
  claimDeadline: string;
  status: "upcoming" | "active" | "ended";
}

interface EligibilityCheck {
  isEligible: boolean;
  allocation: string;
  criteria: {
    name: string;
    met: boolean;
  }[];
}

export default function Airdrop() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();
  const address = "0x1234...5678";
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);

  const airdropRounds: AirdropRound[] = [
    {
      round: 1,
      title: "Early Adopters",
      totalAmount: "10,000,000 PERPX",
      eligibleUsers: 5000,
      claimDeadline: "2025-12-31",
      status: "active"
    },
    {
      round: 2,
      title: "Community Contributors",
      totalAmount: "15,000,000 PERPX",
      eligibleUsers: 8000,
      claimDeadline: "2026-03-31",
      status: "upcoming"
    },
    {
      round: 3,
      title: "Liquidity Providers",
      totalAmount: "20,000,000 PERPX",
      eligibleUsers: 10000,
      claimDeadline: "2026-06-30",
      status: "upcoming"
    }
  ];

  const checkEligibility = async () => {
    if (!isConnected || !address) return;
    
    setChecking(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo eligibility data
    const isEligible = Math.random() > 0.3;
    setEligibility({
      isEligible,
      allocation: isEligible ? `${(Math.random() * 5000 + 500).toFixed(0)} PERPX` : "0 PERPX",
      criteria: [
        { name: t('airdrop.criteria.trading'), met: Math.random() > 0.5 },
        { name: t('airdrop.criteria.volume'), met: Math.random() > 0.5 },
        { name: t('airdrop.criteria.referral'), met: Math.random() > 0.5 },
        { name: t('airdrop.criteria.community'), met: Math.random() > 0.5 }
      ]
    });
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to check your airdrop eligibility and claim rewards."
        />
      )}
      
      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Hero Section */}
        <div className="mb-8 lg:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{t('airdrop.title')}</h1>
          <p className="text-white/70 text-lg max-w-3xl mx-auto">
            {t('airdrop.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-white/60 text-sm mb-2">{t('airdrop.totalDistribution')}</div>
            <div className="text-3xl font-bold text-white">45M PERPX</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-white/60 text-sm mb-2">{t('airdrop.eligibleUsers')}</div>
            <div className="text-3xl font-bold text-white">23,000+</div>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <div className="text-white/60 text-sm mb-2">{t('airdrop.claimed')}</div>
            <div className="text-3xl font-bold text-primary">12,450</div>
          </div>
        </div>

        {/* Eligibility Checker */}
        <div className="glass-card p-8 rounded-xl mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {t('airdrop.checkEligibility')}
          </h2>
          
          {!isConnected ? (
            <div className="text-center">
              <Wallet className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-6">{t('airdrop.connectWallet')}</p>
            </div>
          ) : eligibility === null ? (
            <div className="text-center">
              <Button 
                onClick={checkEligibility}
                disabled={checking}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
              >
                {checking ? t('airdrop.checking') : t('airdrop.checkNow')}
              </Button>
            </div>
          ) : (
            <div>
              <div className={`p-6 rounded-lg mb-6 ${eligibility.isEligible ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                <div className="text-center">
                  {eligibility.isEligible ? (
                    <>
                      <Check className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold text-white mb-2">{t('airdrop.eligible')}</h3>
                      <p className="text-white/80 text-lg mb-4">{t('airdrop.yourAllocation')}</p>
                      <div className="text-4xl font-bold text-green-400">{eligibility.allocation}</div>
                    </>
                  ) : (
                    <>
                      <X className="h-12 w-12 text-red-400 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold text-white mb-2">{t('airdrop.notEligible')}</h3>
                      <p className="text-white/80">{t('airdrop.notEligibleDesc')}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="text-white font-semibold mb-3">{t('airdrop.criteriaCheck')}</h4>
                {eligibility.criteria.map((criterion, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    {criterion.met ? (
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                    )}
                    <span className={criterion.met ? 'text-white' : 'text-white/60'}>
                      {criterion.name}
                    </span>
                  </div>
                ))}
              </div>

              {eligibility.isEligible && (
                <Button className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg">
                  {t('airdrop.claimNow')}
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={() => setEligibility(null)}
                className="w-full mt-3"
              >
                {t('airdrop.checkAgain')}
              </Button>
            </div>
          )}
        </div>

        {/* Airdrop Rounds */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">{t('airdrop.rounds')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {airdropRounds.map((round) => (
              <div key={round.round} className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Round {round.round}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    round.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    round.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {round.status === 'active' ? t('airdrop.active') :
                     round.status === 'upcoming' ? t('airdrop.upcoming') :
                     t('airdrop.ended')}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-4">{round.title}</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm">{t('airdrop.totalAmount')}</div>
                    <div className="text-white font-semibold">{round.totalAmount}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">{t('airdrop.eligibleUsers')}</div>
                    <div className="text-white font-semibold">{round.eligibleUsers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">{t('airdrop.deadline')}</div>
                    <div className="text-white font-semibold">{round.claimDeadline}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Qualify */}
        <div className="glass-card p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6">{t('airdrop.howToQualify')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">{t('airdrop.tradingActivity')}</h3>
              <p className="text-white/70">{t('airdrop.tradingActivityDesc')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">{t('airdrop.volumeRequirement')}</h3>
              <p className="text-white/70">{t('airdrop.volumeRequirementDesc')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">{t('airdrop.referralProgram')}</h3>
              <p className="text-white/70">{t('airdrop.referralProgramDesc')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">{t('airdrop.communityEngagement')}</h3>
              <p className="text-white/70">{t('airdrop.communityEngagementDesc')}</p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
