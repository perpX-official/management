import { useEffect, useRef } from 'react';
import { useRewardsState } from './useRewardsState';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Global hook that captures ?ref= parameter from any page URL
 * and auto-applies the referral code once the user connects their wallet.
 * 
 * This should be mounted once at the App level so it works regardless
 * of which page the user lands on.
 */
export function useReferralAutoApply() {
  const { isConnected, address } = useRewardsState();
  const hasAttempted = useRef(false);

  // Step 1: Capture ?ref= parameter from URL on any page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('pendingReferralCode', refCode.toUpperCase());
      // Clean the URL without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // Step 2: Fetch profile to check if already referred
  const safeAddress = address?.trim() || '';
  const { data: profile } = trpc.rewards.getProfile.useQuery(
    { walletAddress: safeAddress, chainType: 'evm' },
    { enabled: safeAddress.length > 0 && isConnected }
  );

  // Step 3: Auto-apply pending referral code
  const applyReferralCode = trpc.referral.applyCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        localStorage.removeItem('pendingReferralCode');
      } else {
        // Code invalid or already applied - clear it
        localStorage.removeItem('pendingReferralCode');
        if (data.message !== "You have already used a referral code") {
          toast.info(data.message);
        }
      }
    },
    onError: () => {
      localStorage.removeItem('pendingReferralCode');
    },
  });

  useEffect(() => {
    if (!address || !profile || hasAttempted.current) return;
    // Only apply if user hasn't already been referred
    if (profile.referredBy) {
      localStorage.removeItem('pendingReferralCode');
      return;
    }
    const pendingCode = localStorage.getItem('pendingReferralCode');
    if (pendingCode) {
      hasAttempted.current = true;
      applyReferralCode.mutate({ walletAddress: address, referralCode: pendingCode });
    }
  }, [address, profile?.referredBy]);
}
