import Header from "@/components/Header";
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";

export default function Stats() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();
  const stats = [
    { labelKey: "stats.volume24h", value: "$3.37B", change: "+12.5%", trend: "up" },
    { labelKey: "stats.totalVolume", value: "$139.20B", change: "+8.2%", trend: "up" },
    { labelKey: "stats.totalUsers", value: "147,278", change: "+5.3%", trend: "up" },
    { labelKey: "stats.openInterest", value: "$892.5M", change: "-2.1%", trend: "down" },
    { labelKey: "stats.totalTrades", value: "12.5M", change: "+15.8%", trend: "up" },
    { labelKey: "stats.activeTraders", value: "45,892", change: "+7.4%", trend: "up" },
  ];

  const topMarkets = [
    { pair: "BTC/USDC", volume: "$1.2B", change: "+8.5%", price: "$111,062.6" },
    { pair: "ETH/USDC", volume: "$890M", change: "+5.2%", price: "$3,245.8" },
    { pair: "SOL/USDC", volume: "$450M", change: "+12.3%", price: "$191.5" },
    { pair: "XRP/USDC", volume: "$320M", change: "-3.1%", price: "$2.44" },
    { pair: "DOGE/USDC", volume: "$280M", change: "+6.8%", price: "$0.20" },
  ];

  const recentTrades = [
    { time: "10:45:23", pair: "BTC/USDC", side: "Long", size: "$125,000", price: "$111,062.6" },
    { time: "10:45:18", pair: "ETH/USDC", side: "Short", size: "$85,000", price: "$3,245.8" },
    { time: "10:45:12", pair: "SOL/USDC", side: "Long", size: "$45,000", price: "$191.5" },
    { time: "10:45:08", pair: "BTC/USDC", side: "Long", size: "$200,000", price: "$111,073.1" },
    { time: "10:45:02", pair: "XRP/USDC", side: "Short", size: "$32,000", price: "$2.44" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to view detailed platform statistics and market analysis."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <ComingSoonOverlay />
        <div className="container mx-auto px-4 py-8 pointer-events-none filter grayscale-[0.5] blur-[2px] opacity-20">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('stats.title')}</h1>
            <p className="text-white/60">{t('stats.subtitle')}</p>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card rounded-xl p-6 hover-reveal">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-white/60">{t(stat.labelKey)}</div>
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Top Markets */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('stats.topMarkets')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">{t('stats.pair')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">{t('stats.price')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">{t('stats.volume24h')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">{t('stats.change')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topMarkets.map((market, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{market.pair}</div>
                      </td>
                      <td className="py-4 px-4 text-right text-white">{market.price}</td>
                      <td className="py-4 px-4 text-right text-white">{market.volume}</td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        market.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {market.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t('stats.recentTrades')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">{t('stats.time')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">{t('stats.pair')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">{t('stats.side')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">{t('stats.size')}</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">{t('stats.price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-sm text-white/60">{trade.time}</td>
                      <td className="py-4 px-4 text-white">{trade.pair}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.side === 'Long' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {t(trade.side === 'Long' ? 'stats.long' : 'stats.short')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-white">{trade.size}</td>
                      <td className="py-4 px-4 text-right text-white">{trade.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('stats.tradingVolume7d')}</h3>
              <div className="space-y-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const volume = Math.random() * 5 + 2;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 text-sm text-white/60">{day}</div>
                      <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-end px-3"
                          style={{ width: `${(volume / 7) * 100}%` }}
                        >
                          <span className="text-xs font-medium text-white">${volume.toFixed(2)}B</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">{t('stats.userGrowth')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t('stats.newUsers24h')}</div>
                    <div className="text-2xl font-bold text-white">2,458</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t('stats.activeUsers24h')}</div>
                    <div className="text-2xl font-bold text-white">45,892</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 mb-1">{t('stats.totalTraders')}</div>
                    <div className="text-2xl font-bold text-white">147,278</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
