import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import type { ChainKind } from "@/lib/rewardsStorage";

interface RewardsDashboardProps {
  chain: ChainKind | null;
  address: string | null;
  xFollowUrl?: string;
  discordInviteUrl?: string;
  xMentionHowtoUrl?: string;
}

export function RewardsDashboard({
  chain,
  address,
  xFollowUrl = "https://twitter.com/perpx",
  discordInviteUrl = "https://discord.gg/5BUJrR3JnK",
  xMentionHowtoUrl = "https://docs.perpx.com/howto"
}: RewardsDashboardProps) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {/* Stage Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              Rewards Dashboard
            </h1>
            <p className="text-sm sm:text-base text-white/70">
              Connected: <span className="text-primary font-mono">{address}</span> ({chain?.toUpperCase()})
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <Card className="bg-card border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">Total Volume</div>
            <div className="text-lg sm:text-2xl font-bold text-white">$1,234,567</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">PnL</div>
            <div className="text-lg sm:text-2xl font-bold text-green-500">+$5,432</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">Points</div>
            <div className="text-lg sm:text-2xl font-bold text-white">1,500</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">Rank</div>
            <div className="text-lg sm:text-2xl font-bold text-white">#42</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Community Tasks</h3>
            <div className="space-y-4">
              <a href={xFollowUrl} target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <div className="font-medium text-white">Follow on X</div>
                <div className="text-sm text-white/60">Get latest updates</div>
              </a>
              <a href={discordInviteUrl} target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <div className="font-medium text-white">Join Discord</div>
                <div className="text-sm text-white/60">Join our community</div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Referral Program</h3>
            <div className="p-4 rounded-xl bg-white/5 mb-4">
              <div className="text-sm text-white/60 mb-1">Your Referral Link</div>
              <div className="font-mono text-primary truncate">https://perpx.com/ref/{address?.slice(0, 8)}</div>
            </div>
            <a href={xMentionHowtoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
              How to earn more points? →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
