import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import {
  Award,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const activities = [
  { action: "First Trade", points: "+100", date: "2025-10-20", status: "Pending" },
  { action: "Daily Trading", points: "+50", date: "2025-10-19", status: "Completed" },
  { action: "Referral Bonus", points: "+200", date: "2025-10-18", status: "Completed" },
];

export default function Points() {
  const { isConnected } = useRewardsState();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to view your points, tier status, and rewards history."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            Rewards & Points
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Earn points through trading, referrals, and community participation
          </p>
        </div>

        {/* Points Overview */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          <Card className="bg-gradient-to-br from-primary/20 to-transparent border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/30 flex items-center justify-center">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-white/60">Total Points</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-white/60">Trading Points</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-white/60">Referral Points</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-white/60">Current Tier</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">Bronze</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to Earn Points */}
        <Card className="border-white/10 mb-8 sm:mb-12">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base sm:text-lg text-white">How to earn points</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-lg bg-card border border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Trade Volume</h3>
                <p className="text-xs sm:text-sm text-white/60">
                  Earn 1 point for every $100 in trading volume
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Referrals</h3>
                <p className="text-xs sm:text-sm text-white/60">
                  Get 200 points for each friend who completes their first trade
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Daily Tasks</h3>
                <p className="text-xs sm:text-sm text-white/60">
                  Complete daily challenges to earn bonus points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base sm:text-lg text-white">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-sm sm:text-base text-white font-medium mb-1">
                      {activity.action}
                    </div>
                    <div className="text-xs sm:text-sm text-white/60">{activity.date}</div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-sm sm:text-base font-semibold text-primary">
                      {activity.points}
                    </div>
                    <div
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${
                        activity.status === "Completed"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {activity.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      )}
    </div>
  );
}

