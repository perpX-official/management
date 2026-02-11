import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import { Button } from "@/components/ui/button";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { TrendingUp, Lock, Unlock } from "lucide-react";

interface StakingAsset {
  symbol: string;
  name: string;
  apy: number;
  tvl: string;
  minStake: string;
  lockPeriod: string;
  icon: string;
}

export default function Stake() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();

  const stakingAssets: StakingAsset[] = [
    {
      symbol: "USDT",
      name: "Tether USD",
      apy: 12.5,
      tvl: "$45.2M",
      minStake: "100 USDT",
      lockPeriod: "7 days",
      icon: "💵"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      apy: 8.3,
      tvl: "$32.8M",
      minStake: "0.1 ETH",
      lockPeriod: "14 days",
      icon: "⟠"
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      apy: 6.8,
      tvl: "$28.5M",
      minStake: "0.01 BTC",
      lockPeriod: "30 days",
      icon: "₿"
    },
    {
      symbol: "SOL",
      name: "Solana",
      apy: 15.2,
      tvl: "$18.3M",
      minStake: "10 SOL",
      lockPeriod: "7 days",
      icon: "◎"
    },
    {
      symbol: "BNB",
      name: "BNB",
      apy: 10.5,
      tvl: "$22.1M",
      minStake: "1 BNB",
      lockPeriod: "14 days",
      icon: "🔶"
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      apy: 11.8,
      tvl: "$38.7M",
      minStake: "100 USDC",
      lockPeriod: "7 days",
      icon: "💲"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to stake assets and earn passive income with competitive APY rates."
        />
      )}
      
      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <ComingSoonOverlay />
        <div className="container mx-auto px-4 py-8 lg:py-12 pointer-events-none filter grayscale-[0.5] blur-[2px] opacity-20">
          {/* Hero Section */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">{t('stake.title')}</h1>
            </div>
            <p className="text-white/70 text-lg max-w-3xl">
              {t('stake.subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 rounded-xl">
              <div className="text-white/60 text-sm mb-2">{t('stake.totalValueLocked')}</div>
              <div className="text-2xl font-bold text-white">$185.6M</div>
              <div className="text-green-400 text-sm mt-1">+12.3% {t('stake.thisWeek')}</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-white/60 text-sm mb-2">{t('stake.totalStakers')}</div>
              <div className="text-2xl font-bold text-white">24,567</div>
              <div className="text-green-400 text-sm mt-1">+8.5% {t('stake.thisWeek')}</div>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <div className="text-white/60 text-sm mb-2">{t('stake.averageApy')}</div>
              <div className="text-2xl font-bold text-white">10.85%</div>
              <div className="text-primary text-sm mt-1">{t('stake.acrossAllAssets')}</div>
            </div>
          </div>

          {/* Staking Assets Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('stake.availableAssets')}
              </h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60 font-medium text-sm">{t('stake.asset')}</th>
                    <th className="text-right p-4 text-white/60 font-medium text-sm">{t('stake.apy')}</th>
                    <th className="text-right p-4 text-white/60 font-medium text-sm">{t('stake.tvl')}</th>
                    <th className="text-right p-4 text-white/60 font-medium text-sm">{t('stake.minStake')}</th>
                    <th className="text-right p-4 text-white/60 font-medium text-sm">{t('stake.lockPeriod')}</th>
                    <th className="text-right p-4 text-white/60 font-medium text-sm">{t('stake.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stakingAssets.map((asset, index) => (
                    <tr 
                      key={asset.symbol}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                            {asset.icon}
                          </div>
                          <div>
                            <div className="text-white font-medium">{asset.symbol}</div>
                            <div className="text-white/60 text-sm">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-green-400 font-bold text-lg">{asset.apy}%</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-white">{asset.tvl}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-white/80">{asset.minStake}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-white/80">{asset.lockPeriod}</div>
                      </td>
                      <td className="p-4 text-right">
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                          {t('stake.stakeNow')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-white/5">
              {stakingAssets.map((asset) => (
                <div key={asset.symbol} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                        {asset.icon}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{asset.symbol}</div>
                        <div className="text-white/60 text-sm">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">{asset.apy}%</div>
                      <div className="text-white/60 text-xs">{t('stake.apy')}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-white/60 text-xs mb-1">{t('stake.tvl')}</div>
                      <div className="text-white font-medium">{asset.tvl}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-xs mb-1">{t('stake.minStake')}</div>
                      <div className="text-white font-medium">{asset.minStake}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-xs mb-1">{t('stake.lockPeriod')}</div>
                      <div className="text-white font-medium">{asset.lockPeriod}</div>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    {t('stake.stakeNow')}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-white">{t('stake.howItWorks')}</h3>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('stake.step1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('stake.step2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('stake.step3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('stake.step4')}</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Unlock className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-white">{t('stake.benefits')}</h3>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>{t('stake.benefit1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>{t('stake.benefit2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>{t('stake.benefit3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>{t('stake.benefit4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
