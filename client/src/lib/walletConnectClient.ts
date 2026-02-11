import SignClient from '@walletconnect/sign-client';
import { WALLETCONNECT_PROJECT_ID, WC_METADATA } from '@/config/walletConstants';

let clientPromise: Promise<SignClient> | null = null;

export function getWalletConnectClient() {
  if (!clientPromise) {
    clientPromise = SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: WC_METADATA,
    });
  }
  return clientPromise;
}
