import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { TrendingUp, Droplet, Coins, Shield, Zap, Users } from "lucide-react";

export default function Earn() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();

  const liquidityPools = [
    { pair: "BTC/USDT", apy: "18.5%", tvl: "$125.3M", volume24h: "$45.2M", rewards: "PERPX + Fees" },
    { pair: "ETH/USDT", apy: "15.2%", tvl: "$98.7M", volume24h: "$38.5M", rewards: "PERPX + Fees" },
    { pair: "SOL/USDT", apy: "22.8%", tvl: "$42.1M", volume24h: "$18.9M", rewards: "PERPX + Fees" },
    { pair: "BNB/USDT", apy: "16.7%", tvl: "$35.4M", volume24h: "$12.3M", rewards: "PERPX + Fees" },
  ];

  const lendingAssets = [
    { asset: "USDT", apy: "8.5%", supplied: "$85.2M", available: "$12.8M", utilization: "85%" },
    { asset: "USDC", apy: "7.8%", supplied: "$62.4M", available: "$18.5M", utilization: "77%" },
    { asset: "DAI", apy: "9.2%", supplied: "$38.9M", available: "$8.2M", utilization: "83%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to provide liquidity, lend assets, and earn rewards."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <ComingSoonOverlay />
        <div className="container py-8 space-y-8 pointer-events-none filter grayscale-[0.5] blur-[2px] opacity-20">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Coins className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">{t('earn.title')}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('earn.subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 glass-card border-white/10">
              <div className="space-y-2">
                <p className="text-sm text-white/60">{t('earn.totalValueLocked')}</p>
                <p className="text-3xl font-bold text-white">$428.9M</p>
                <p className="text-sm text-green-400">+15.2% {t('earn.thisWeek')}</p>
              </div>
            </Card>
            <Card className="p-6 glass-card border-white/10">
              <div className="space-y-2">
                <p className="text-sm text-white/60">{t('earn.totalProviders')}</p>
                <p className="text-3xl font-bold text-white">18,234</p>
                <p className="text-sm text-green-400">+9.8% {t('earn.thisWeek')}</p>
              </div>
            </Card>
            <Card className="p-6 glass-card border-white/10">
              <div className="space-y-2">
                <p className="text-sm text-white/60">{t('earn.averageApy')}</p>
                <p className="text-3xl font-bold text-white">14.3%</p>
                <p className="text-sm text-white/60">{t('earn.acrossAllPools')}</p>
              </div>
            </Card>
          </div>

          {/* Liquidity Pools Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Droplet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">{t('earn.liquidityPools')}</h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="glass-card border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.pair')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.apy')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.tvl')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.volume24h')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.rewards')}</th>
                      <th className="text-right p-4 text-sm font-medium text-white/60">{t('earn.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liquidityPools.map((pool, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{pool.pair}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 font-semibold">{pool.apy}</span>
                        </td>
                        <td className="p-4 text-white">{pool.tvl}</td>
                        <td className="p-4 text-white/80">{pool.volume24h}</td>
                        <td className="p-4 text-white/80">{pool.rewards}</td>
                        <td className="p-4 text-right">
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            {t('earn.addLiquidity')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {liquidityPools.map((pool, index) => (
                <Card key={index} className="p-4 glass-card border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{pool.pair}</span>
                    <span className="text-green-400 font-semibold">{pool.apy}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-white/60">{t('earn.tvl')}</p>
                      <p className="text-white">{pool.tvl}</p>
                    </div>
                    <div>
                      <p className="text-white/60">{t('earn.volume24h')}</p>
                      <p className="text-white">{pool.volume24h}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">{t('earn.rewards')}</p>
                    <p className="text-white text-sm">{pool.rewards}</p>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                    {t('earn.addLiquidity')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Lending Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">{t('earn.lending')}</h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="glass-card border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.asset')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.supplyApy')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.totalSupplied')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.available')}</th>
                      <th className="text-left p-4 text-sm font-medium text-white/60">{t('earn.utilization')}</th>
                      <th className="text-right p-4 text-sm font-medium text-white/60">{t('earn.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lendingAssets.map((asset, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-white">{asset.asset}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 font-semibold">{asset.apy}</span>
                        </td>
                        <td className="p-4 text-white">{asset.supplied}</td>
                        <td className="p-4 text-white/80">{asset.available}</td>
                        <td className="p-4 text-white/80">{asset.utilization}</td>
                        <td className="p-4 text-right">
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            {t('earn.supply')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {lendingAssets.map((asset, index) => (
                <Card key={index} className="p-4 glass-card border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{asset.asset}</span>
                    <span className="text-green-400 font-semibold">{asset.apy}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-white/60">{t('earn.totalSupplied')}</p>
                      <p className="text-white">{asset.supplied}</p>
                    </div>
                    <div>
                      <p className="text-white/60">{t('earn.available')}</p>
                      <p className="text-white">{asset.available}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">{t('earn.utilization')}</p>
                    <p className="text-white text-sm">{asset.utilization}</p>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                    {t('earn.supply')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('earn.benefits')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 glass-card border-white/10 space-y-3">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{t('earn.secureProtocol')}</h3>
                <p className="text-sm text-white/60">{t('earn.secureProtocolDesc')}</p>
              </Card>
              <Card className="p-6 glass-card border-white/10 space-y-3">
                <Zap className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{t('earn.autoCompounding')}</h3>
                <p className="text-sm text-white/60">{t('earn.autoCompoundingDesc')}</p>
              </Card>
              <Card className="p-6 glass-card border-white/10 space-y-3">
                <Users className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">{t('earn.flexibleWithdrawal')}</h3>
                <p className="text-sm text-white/60">{t('earn.flexibleWithdrawalDesc')}</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
