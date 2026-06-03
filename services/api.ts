import type {
  AirdropStatus,
  AirdropStatusResponse,
  AnalyzeResponse,
  AnalyzeResult,
  AuthResponse,
  ReferralResponse,
  ReferralStats,
  ScanHistoryItem,
  Signal,
  TokenPair,
  User,
  UserProfile,
  UserProfileResponse,
  WalletNonceResponse,
  WalletStatus,
  WalletStatusResponse
} from "@/utils/schemas";
import {
  clearApiTokens,
  getApiAccessToken,
  SafeScanApiError,
  setApiTokens,
  setTokenPersister,
  type ApiError
} from "@/services/apiClient";
import * as authEndpoints from "@/services/endpoints/auth";
import * as scanEndpoints from "@/services/endpoints/scan";
import * as userEndpoints from "@/services/endpoints/user";
import * as airdropEndpoints from "@/services/endpoints/airdrop";
import * as walletEndpoints from "@/services/endpoints/wallet";
import * as referralEndpoints from "@/services/endpoints/referral";
import * as checksEndpoints from "@/services/endpoints/checks";
import * as systemEndpoints from "@/services/endpoints/system";
import { mockAnalyzeResponse } from "@/services/mock";

export {
  clearApiTokens,
  getApiAccessToken,
  SafeScanApiError,
  setApiTokens,
  setTokenPersister
};
export type { ApiError };
export { mockAnalyzeResponse };

export type {
  AirdropStatus,
  AirdropStatusResponse,
  AnalyzeResponse,
  AnalyzeResult,
  AuthResponse,
  ReferralResponse,
  ReferralStats,
  ScanHistoryItem,
  Signal,
  TokenPair,
  User,
  UserProfile,
  UserProfileResponse,
  WalletNonceResponse,
  WalletStatus,
  WalletStatusResponse
};

export const api = {
  auth: {
    verifyToken: authEndpoints.verifyToken,
    refreshToken: authEndpoints.refreshToken,
    logout: authEndpoints.logout
  },
  scan: {
    analyze: scanEndpoints.analyze,
    file: scanEndpoints.file,
    history: scanEndpoints.history,
    report: scanEndpoints.report
  },
  user: {
    profile: userEndpoints.profile,
    delete: userEndpoints.deleteAccount
  },
  airdrop: {
    status: airdropEndpoints.status
  },
  wallet: {
    connect: walletEndpoints.connect,
    status: walletEndpoints.status,
    nonce: walletEndpoints.nonce,
    verify: walletEndpoints.verify,
    disconnect: walletEndpoints.disconnect
  },
  referral: {
    stats: referralEndpoints.stats
  },
  checks: {
    reputation: checksEndpoints.reputation,
    redirects: checksEndpoints.redirects,
    domain: checksEndpoints.domain,
    cryptoPatterns: checksEndpoints.cryptoPatterns
  },
  system: {
    health: systemEndpoints.health,
    wakeAnalyze: systemEndpoints.wakeAnalyze
  }
};

export async function analyzeUrl(payload: string): Promise<AnalyzeResponse> {
  try {
    const result = await scanEndpoints.analyze(payload);
    return { ...result, source: "backend" };
  } catch {
    return { ...mockAnalyzeResponse(payload), source: "demo-fallback" };
  }
}

export async function verifyGoogleToken(token: string) {
  const result = await authEndpoints.verifyToken(token);
  return { session: result.accessToken, user: result.user };
}

export function logoutSession(sessionOverride?: string | null) {
  return authEndpoints.logout(sessionOverride);
}

export function fetchProfile(): Promise<UserProfileResponse> {
  return userEndpoints.profile();
}

export function fetchAirdropStatus(): Promise<AirdropStatusResponse> {
  return airdropEndpoints.status();
}

export function reportUrl(url: string, reason: string) {
  return scanEndpoints.reportUrl(url, reason);
}

export function checkReputation(url: string) {
  return checksEndpoints.reputation(url);
}

export function traceRedirects(url: string) {
  return checksEndpoints.redirects(url);
}

export function checkDomain(url: string) {
  return checksEndpoints.domain(url);
}

export function checkCryptoPatterns(url: string) {
  return checksEndpoints.cryptoPatterns(url);
}

export function fetchWalletStatus() {
  return walletEndpoints.status();
}

export function disconnectWallet() {
  return walletEndpoints.disconnect();
}

export function fetchReferralStatus() {
  return referralEndpoints.stats();
}

export function requestWalletNonce(walletAddress: string) {
  return walletEndpoints.nonce(walletAddress);
}

export function verifyWallet(walletAddress: string, signature: string) {
  return walletEndpoints.verify(walletAddress, signature);
}
