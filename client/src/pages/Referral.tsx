import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Check, Users, Gift, TrendingUp, Share2, Trophy, Lock, CheckCircle2, Twitter, MessageCircle, AlertCircle } from "lucide-react";
import { POINTS_TO_USD_RATE } from "@shared/const";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";
import { useState } from "react";
import { toast } from "sonner";


export default function Referral() {
  const { t } = useLanguage();
  const { isConnected, address: walletAddress } = useRewardsState();
  
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'leaderboard'>('overview');

  // Check if user can generate referral code
  const { data: codeStatus, isLoading: codeStatusLoading } = trpc.referral.canGenerateCode.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress && isConnected }
  );

  // Fetch referral stats
  const { data: referralStats, isLoading: statsLoading, refetch: refetchStats } = trpc.referral.getStats.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress && isConnected }
  );

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.referral.getLeaderboard.useQuery(
    { limit: 10 },
    { enabled: isConnected }
  );

  // Apply referral code mutation
  const applyCodeMutation = trpc.referral.applyCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setReferralCodeInput('');
        refetchStats();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === 'code' ? 'Code copied!' : 'Link copied!');
      setTimeout(() => setCopied(null), 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };

  // Auto-detect current domain for referral links
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const shareOnTwitter = () => {
    if (!codeStatus?.referralCode || !codeStatus?.canGenerate) return;
    const refLink = `${baseUrl}?ref=${codeStatus.referralCode}`;
    const text = encodeURIComponent(`Join me on PerpX - the next-gen perpetual DEX! Use my referral code ${codeStatus.referralCode} and earn bonus rewards 🚀`);
    const url = encodeURIComponent(refLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleApplyCode = () => {
    if (!referralCodeInput.trim() || !walletAddress) return;
    applyCodeMutation.mutate({
      walletAddress,
      referralCode: referralCodeInput.trim().toUpperCase(),
    });
  };

  const referralLink = (codeStatus?.referralCode && codeStatus?.canGenerate)
    ? `${baseUrl}?ref=${codeStatus.referralCode}` 
    : '';

  // Tier colors
  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'Diamond': return 'text-cyan-300';
      case 'Platinum': return 'text-gray-300';
      case 'Gold': return 'text-yellow-400';
      case 'Silver': return 'text-gray-400';
      default: return 'text-amber-600';
    }
  };

  // Check if referral code is available AND all conditions are still met
  // If user disconnects any service, canGenerate becomes false and code should be hidden
  const canGenerateCode = codeStatus?.canGenerate;
  const hasReferralCode = codeStatus?.hasCode && codeStatus?.referralCode && canGenerateCode;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to access your referral dashboard and start earning rewards."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#0ABAB5] to-purple-500 bg-clip-text text-transparent">
              {t('referral.title')}
            </h1>
            <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto">
              {t('referral.subtitle')}
            </p>
          </div>

          {/* Referral Code Card */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
            <CardContent className="p-6 sm:p-8">
              {/* Show unlock requirements if code not available */}
              {!hasReferralCode && (
                <div className={`mb-6 p-4 ${codeStatus?.hasCode && !canGenerateCode ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'} rounded-lg`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 ${codeStatus?.hasCode && !canGenerateCode ? 'text-red-500' : 'text-yellow-500'} flex-shrink-0 mt-0.5`} />
                    <div>
                      <h4 className={`font-semibold ${codeStatus?.hasCode && !canGenerateCode ? 'text-red-400' : 'text-yellow-400'} mb-2`}>
                        {codeStatus?.hasCode && !canGenerateCode ? 'Referral Code Temporarily Disabled' : 'Unlock Your Referral Code'}
                      </h4>
                      <p className="text-white/70 text-sm mb-4">
                        {codeStatus?.hasCode && !canGenerateCode 
                          ? 'Your referral code is temporarily disabled because you disconnected a required service. Reconnect all services to reactivate your code:'
                          : 'Complete the following tasks on the Rewards page to get your referral code:'
                        }
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {codeStatus?.xConnected ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/40" />
                          )}
                          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                          <span className={codeStatus?.xConnected ? 'text-green-400' : 'text-white/60'}>
                            Connect X (Twitter) Account
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {codeStatus?.discordConnected ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/40" />
                          )}
                          <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                          <span className={codeStatus?.discordConnected ? 'text-green-400' : 'text-white/60'}>
                            Connect Discord Account
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {codeStatus?.discordVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-white/40" />
                          )}
                          <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                          <span className={codeStatus?.discordVerified ? 'text-green-400' : 'text-white/60'}>
                            Verify Discord Server Membership
                          </span>
                        </div>
                      </div>
                      <Button 
                        className="mt-4 bg-[#0ABAB5] hover:bg-[#099e9a]"
                        onClick={() => window.location.href = '/rewards'}
                      >
                        Go to Rewards Page
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  {/* Your Referral Code */}
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{t('referral.code')}</label>
                    <div className="flex items-center gap-3">
                      <code className={`bg-white/10 px-4 py-3 rounded-lg font-mono text-lg sm:text-xl flex-1 sm:flex-none ${
                        hasReferralCode ? 'text-[#0ABAB5]' : 'text-white/40'
                      }`}>
                        {codeStatusLoading ? '...' : hasReferralCode ? codeStatus.referralCode : 'Complete tasks to unlock'}
                      </code>
                      <button
                        onClick={() => hasReferralCode && copyToClipboard(codeStatus.referralCode!, 'code')}
                        className={`p-3 rounded-lg transition-colors ${
                          hasReferralCode 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-white/5 cursor-not-allowed'
                        }`}
                        title={hasReferralCode ? "Copy code" : "Complete tasks to unlock"}
                        disabled={!hasReferralCode}
                      >
                        {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Your Referral Link */}
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">{t('referral.link')}</label>
                    <div className="flex items-center gap-3">
                      <Input
                        readOnly
                        value={codeStatusLoading ? 'Loading...' : hasReferralCode ? referralLink : 'Complete tasks to unlock your referral link'}
                        className={`bg-white/10 border-white/10 flex-1 ${hasReferralCode ? 'text-white/80' : 'text-white/40'}`}
                      />
                      <button
                        onClick={() => hasReferralCode && copyToClipboard(referralLink, 'link')}
                        className={`p-3 rounded-lg transition-colors ${
                          hasReferralCode 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-white/5 cursor-not-allowed'
                        }`}
                        title={hasReferralCode ? "Copy link" : "Complete tasks to unlock"}
                        disabled={!hasReferralCode}
                      >
                        {copied === 'link' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                  <Button
                    onClick={shareOnTwitter}
                    className={`flex items-center justify-center gap-2 ${
                      hasReferralCode 
                        ? 'bg-[#1DA1F2] hover:bg-[#1a8cd8]' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!hasReferralCode}
                  >
                    <Share2 className="w-5 h-5" />
                    Share on X
                  </Button>
                  <Button
                    onClick={() => hasReferralCode && copyToClipboard(referralLink, 'link')}
                    className={`flex items-center justify-center gap-2 ${
                      hasReferralCode 
                        ? 'bg-[#0ABAB5] hover:bg-[#099e9a]' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    disabled={!hasReferralCode}
                  >
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apply Referral Code (if not already referred) */}
          {!referralStats?.referredBy && (
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-base sm:text-lg text-white">Enter Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Enter referral code (e.g., ABC12345)"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/10 text-white flex-1"
                    maxLength={16}
                  />
                  <Button
                    onClick={handleApplyCode}
                    disabled={!referralCodeInput.trim() || applyCodeMutation.isPending}
                    className="bg-[#0ABAB5] hover:bg-[#099e9a]"
                  >
                    {applyCodeMutation.isPending ? 'Applying...' : 'Apply Code'}
                  </Button>
                </div>
                <p className="text-white/50 text-sm mt-2">
                  Enter a friend's referral code. You'll receive <span className="text-[#0ABAB5] font-semibold">50 points</span> + <span className="text-green-400 font-semibold">10% bonus</span> on your earned points when you complete your first task!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#0ABAB5]/20 rounded-lg">
                    <Users className="w-6 h-6 text-[#0ABAB5]" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {statsLoading ? '...' : referralStats?.referrals?.length || 0}
                </div>
                <div className="text-white/60 text-sm">{t('referral.friends')}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {statsLoading ? '...' : referralStats?.referrals?.filter((r: { referrerClaimed: boolean }) => r.referrerClaimed).length || 0}
                </div>
                <div className="text-white/60 text-sm">Active Referrals</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Gift className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#0ABAB5]">
                  {statsLoading ? '...' : referralStats?.referralPointsEarned || 0}
                  <span className="text-xs sm:text-sm text-white/40 font-normal ml-1">
                    (${((referralStats?.referralPointsEarned || 0) * POINTS_TO_USD_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="text-white/60 text-sm">{t('referral.rewards')}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${getTierColor(referralStats?.tier?.name || 'Bronze')}`}>
                  {statsLoading ? '...' : referralStats?.tier?.name || 'Bronze'}
                </div>
                <div className="text-white/60 text-sm">Current Tier</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex border-b border-white/10">
              {(['overview', 'referrals', 'leaderboard'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-4 text-sm sm:text-base font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5] bg-white/5'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'referrals' ? 'My Referrals' : 'Leaderboard'}
                </button>
              ))}
            </div>

            <CardContent className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">How It Works</h3>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-[#0ABAB5]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#0ABAB5] font-bold">1</span>
                      </div>
                      <h4 className="font-semibold mb-1 text-sm">Complete Tasks</h4>
                      <p className="text-white/60 text-xs">Connect X and Discord on the Rewards page</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-[#0ABAB5]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#0ABAB5] font-bold">2</span>
                      </div>
                      <h4 className="font-semibold mb-1 text-sm">Get Your Code</h4>
                      <p className="text-white/60 text-xs">Your unique referral code will be generated</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-[#0ABAB5]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#0ABAB5] font-bold">3</span>
                      </div>
                      <h4 className="font-semibold mb-1 text-sm">Friends Join</h4>
                      <p className="text-white/60 text-xs">Friends sign up with your code and complete first task</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-[#0ABAB5]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#0ABAB5] font-bold">4</span>
                      </div>
                      <h4 className="font-semibold mb-1 text-sm">Earn Rewards</h4>
                      <p className="text-white/60 text-xs">Both you and your friend earn 50 points!</p>
                    </div>
                  </div>

                  {/* Bonus Info */}
                  <div className="p-4 bg-gradient-to-r from-[#0ABAB5]/10 to-purple-500/10 rounded-xl border border-[#0ABAB5]/30">
                    <h4 className="font-semibold text-[#0ABAB5] mb-2">Referral Bonus Details</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• <span className="text-white">Referrer:</span> 50 points (up to 100 at Diamond tier)</li>
                      <li>• <span className="text-white">Referred:</span> 50 points + 10% of earned points (floor)</li>
                      <li>• <span className="text-white">Bonus awarded:</span> After first task completion</li>
                    </ul>
                  </div>

                  {/* Tier Info */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">{t('referral.tiers')}</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60">{t('referral.tier')}</TableHead>
                            <TableHead className="text-white/60">Min Referrals</TableHead>
                            <TableHead className="text-white/60">Bonus Per Referral</TableHead>
                            <TableHead className="text-white/60">% Bonus</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-amber-600 font-semibold">Bronze</TableCell>
                            <TableCell className="text-white/80">0</TableCell>
                            <TableCell className="text-[#0ABAB5]">50 pts</TableCell>
                            <TableCell className="text-green-500">10%</TableCell>
                          </TableRow>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-gray-400 font-semibold">Silver</TableCell>
                            <TableCell className="text-white/80">10</TableCell>
                            <TableCell className="text-[#0ABAB5]">55 pts</TableCell>
                            <TableCell className="text-green-500">11%</TableCell>
                          </TableRow>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-yellow-400 font-semibold">Gold</TableCell>
                            <TableCell className="text-white/80">25</TableCell>
                            <TableCell className="text-[#0ABAB5]">60 pts</TableCell>
                            <TableCell className="text-green-500">12%</TableCell>
                          </TableRow>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-gray-300 font-semibold">Platinum</TableCell>
                            <TableCell className="text-white/80">50</TableCell>
                            <TableCell className="text-[#0ABAB5]">75 pts</TableCell>
                            <TableCell className="text-green-500">15%</TableCell>
                          </TableRow>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-cyan-300 font-semibold">Diamond</TableCell>
                            <TableCell className="text-white/80">100</TableCell>
                            <TableCell className="text-[#0ABAB5]">100 pts</TableCell>
                            <TableCell className="text-green-500">20%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'referrals' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">{t('referral.list')}</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">Wallet Address</TableHead>
                          <TableHead className="text-white/60">Points Earned</TableHead>
                          <TableHead className="text-white/60">Status</TableHead>
                          <TableHead className="text-white/60">Date Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statsLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-white/60">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : referralStats?.referrals && referralStats.referrals.length > 0 ? (
                          referralStats.referrals.map((referral: { referredWallet: string; referrerPoints: number; referrerClaimed: boolean; createdAt: Date }, index: number) => (
                            <TableRow key={index} className="border-white/10 hover:bg-white/5">
                              <TableCell className="text-white font-mono text-sm">
                                {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                              </TableCell>
                              <TableCell className="text-[#0ABAB5]">{referral.referrerPoints} pts</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  referral.referrerClaimed 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {referral.referrerClaimed ? 'Active' : 'Pending First Task'}
                                </span>
                              </TableCell>
                              <TableCell className="text-white/60 text-sm">
                                {new Date(referral.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-white/60">
                              No referrals yet. Share your link to start earning!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Top Referrers</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">Rank</TableHead>
                          <TableHead className="text-white/60">User</TableHead>
                          <TableHead className="text-white/60">Referrals</TableHead>
                          <TableHead className="text-white/60">Points Earned</TableHead>
                          <TableHead className="text-white/60">Tier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-white/60">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : leaderboard && leaderboard.length > 0 ? (
                          leaderboard.map((entry, index) => (
                            <TableRow key={index} className="border-white/10 hover:bg-white/5">
                              <TableCell>
                                <span className={`font-bold ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 
                                  index === 2 ? 'text-amber-600' : 'text-white/60'
                                }`}>
                                  #{index + 1}
                                </span>
                              </TableCell>
                              <TableCell className="text-white font-mono text-sm">
                                {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                              </TableCell>
                              <TableCell className="text-white">{entry.referralCount}</TableCell>
                              <TableCell className="text-[#0ABAB5]">{entry.referralPointsEarned} pts</TableCell>
                              <TableCell className={getTierColor(entry.tier?.name || 'Bronze')}>
                                {entry.tier?.name || 'Bronze'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-white/60">
                              No referrers yet. Be the first!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      )}
    </div>
  );
}
