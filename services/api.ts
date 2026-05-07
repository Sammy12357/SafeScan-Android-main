import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const DEFAULT_TIMEOUT_MS = 60000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const endpoints = {
  authVerify: "/auth/verify",
  authRefresh: "/auth/refresh",
  authLogout: "/auth/logout",
  scanAnalyze: "/api/scan",
  scanHistory: "/api/scan/history",
  scanReport: "/api/report",
  userProfile: "/api/user/profile",
  userDelete: "/api/user",
  airdropStatus: "/api/airdrop/status",
  walletStatus: "/api/wallet",
  walletConnect: "/api/wallet/nonce",
  walletDisconnect: "/api/wallet",
  walletNonce: "/api/wallet/nonce",
  walletVerify: "/api/wallet/verify",
  referralStats: "/api/referral",
  reputation: "/api/check-reputation",
  redirects: "/api/trace-redirects",
  domain: "/api/check-domain",
  cryptoPatterns: "/api/check-crypto-patterns"
} as const;

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

export class SafeScanApiError extends Error implements ApiError {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`SafeScan API ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type Severity = "low" | "medium" | "high";
export type RiskLevel = "safe" | "suspicious" | "high";
export type UserRole = "user" | "admin";

export type Signal = {
  check: string;
  result: string;
  severity: Severity;
  description: string;
  passed?: boolean;
};

export type AnalyzeResult = {
  url: string;
  overallRisk: RiskLevel;
  confidenceScore: number;
  verdict: string;
  signals: Signal[];
  scannedAt: string;
  source?: "backend" | "demo-fallback";
  counted?: boolean;
  scanCount?: number;
  payloadType?: string;
};

export type AnalyzeResponse = AnalyzeResult;

export type User = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
};

export type UserProfile = User & {
  scanCount: number;
  referrals: number;
  tier: string;
  walletConnected: boolean;
};

export type UserProfileResponse = UserProfile;

export type ScanHistoryItem = {
  id: string;
  url: string;
  riskScore: number;
  verdict: string;
  signals: Signal[];
  reported: boolean;
  scannedAt: string;
};

export type AirdropStatus = {
  scanCount: number;
  referrals: number;
  currentTier: string;
  walletConnected: boolean;
  walletAddress?: string | null;
  airdropStatus: string;
  fraudScore: number;
  referralCode?: string | null;
  referralLink?: string | null;
  nextMilestone: string;
};

export type AirdropStatusResponse = AirdropStatus;

export type ReferralStats = {
  code: string;
  link: string;
  referrals: number;
};

export type ReferralResponse = ReferralStats;

export type WalletStatus = {
  connected: boolean;
  walletAddress?: string | null;
  verified?: boolean;
  connectedAt?: string;
  onchain?: {
    solBalance?: number | null;
    txCount?: number | null;
    walletAgeDays?: number | null;
    verifiedAt?: string | null;
  };
};

export type WalletStatusResponse = WalletStatus;

export type WalletNonceResponse = {
  nonce: string;
  message: string;
  expiresAt: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
  timeoutMs?: number;
};

function apiUrl(path: string) {
  if (!API_BASE_URL) throw new SafeScanApiError(0, { error: "Missing EXPO_PUBLIC_API_BASE_URL" });
  return `${API_BASE_URL}${path}`;
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function saveTokens(tokens: TokenPair) {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
  ]);
}

function normalizeAuthResponse(body: unknown): { accessToken: string; refreshToken: string; user: User } {
  const value = body as {
    accessToken?: string;
    refreshToken?: string;
    session?: string;
    user?: User;
  };
  const accessToken = value.accessToken ?? value.session ?? "";
  const refreshToken = value.refreshToken ?? accessToken;
  if (!accessToken || !value.user) throw new SafeScanApiError(500, body);
  return { accessToken, refreshToken, user: value.user };
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new SafeScanApiError(401, { error: "Missing refresh token" });

  const body = await request<TokenPair>(endpoints.authRefresh, {
    method: "POST",
    auth: false,
    retry: false,
    body: JSON.stringify({ refreshToken })
  });
  await saveTokens(body);
  return body;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const accessToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      signal: controller.signal,
      headers
    });

    if (response.status === 401 && options.auth !== false && options.retry !== false) {
      await refreshAccessToken();
      return request<T>(path, { ...options, retry: false });
    }

    const body = await readBody(response);
    if (!response.ok) throw new SafeScanApiError(response.status, body);
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeReportReason(reason: string) {
  const normalized = reason.toLowerCase();
  const validReasons = ["phishing", "wallet_drain", "malware", "spam", "other"];
  if (validReasons.includes(normalized)) return normalized;
  if (normalized.includes("wallet")) return "wallet_drain";
  if (normalized.includes("malware")) return "malware";
  if (normalized.includes("spam")) return "spam";
  if (normalized.includes("phish") || normalized.includes("block")) return "phishing";
  return "other";
}

export const api = {
  auth: {
    async verifyToken(idToken: string) {
      const body = await request<unknown>(endpoints.authVerify, {
        method: "POST",
        auth: false,
        body: JSON.stringify({ token: idToken })
      });
      const result = normalizeAuthResponse(body);
      await saveTokens(result);
      return result;
    },
    async refreshToken(refreshToken: string) {
      const result = await request<TokenPair>(endpoints.authRefresh, {
        method: "POST",
        auth: false,
        retry: false,
        body: JSON.stringify({ refreshToken })
      });
      await saveTokens(result);
      return result;
    },
    async logout(sessionOverride?: string | null) {
      const headers = new Headers();
      if (sessionOverride) headers.set("Authorization", `Bearer ${sessionOverride}`);
      try {
        await request<void>(endpoints.authLogout, {
          method: "POST",
          headers,
          retry: false
        });
      } finally {
        await clearTokens();
      }
    }
  },
  scan: {
    analyze(payload: string) {
      return request<AnalyzeResult>(endpoints.scanAnalyze, {
        method: "POST",
        body: JSON.stringify({ payload })
      });
    },
    history() {
      return request<ScanHistoryItem[]>(endpoints.scanHistory);
    },
    async report(scanId: string, reason: string) {
      await request(endpoints.scanReport, {
        method: "POST",
        body: JSON.stringify({ url: scanId, reason: normalizeReportReason(reason) })
      });
    }
  },
  user: {
    profile() {
      return request<UserProfile>(endpoints.userProfile);
    },
    async delete() {
      await request(endpoints.userDelete, { method: "DELETE" });
    }
  },
  airdrop: {
    status() {
      return request<AirdropStatus>(endpoints.airdropStatus);
    }
  },
  wallet: {
    async connect(publicKey: string) {
      await request(endpoints.walletConnect, {
        method: "POST",
        body: JSON.stringify({ walletAddress: publicKey })
      });
    },
    status() {
      return request<WalletStatus>(endpoints.walletStatus);
    },
    nonce(walletAddress: string) {
      return request<WalletNonceResponse>(endpoints.walletNonce, {
        method: "POST",
        body: JSON.stringify({ walletAddress })
      });
    },
    verify(walletAddress: string, signature: string) {
      return request(endpoints.walletVerify, {
        method: "POST",
        body: JSON.stringify({ walletAddress, signature })
      });
    },
    disconnect() {
      return request(endpoints.walletDisconnect, { method: "DELETE" });
    }
  },
  referral: {
    stats() {
      return request<ReferralStats>(endpoints.referralStats);
    }
  },
  checks: {
    reputation(url: string) {
      return request(endpoints.reputation, {
        method: "POST",
        body: JSON.stringify({ url })
      });
    },
    redirects(url: string) {
      return request(endpoints.redirects, {
        method: "POST",
        body: JSON.stringify({ url })
      });
    },
    domain(url: string) {
      return request(endpoints.domain, {
        method: "POST",
        body: JSON.stringify({ url })
      });
    },
    cryptoPatterns(url: string) {
      return request(endpoints.cryptoPatterns, {
        method: "POST",
        body: JSON.stringify({ url })
      });
    }
  }
};

export async function analyzeUrl(payload: string): Promise<AnalyzeResponse> {
  try {
    const result = await api.scan.analyze(payload);
    return { ...result, source: "backend" };
  } catch {
    return { ...mockAnalyzeResponse(payload), source: "demo-fallback" };
  }
}

export async function verifyGoogleToken(token: string) {
  const result = await api.auth.verifyToken(token);
  return { session: result.accessToken, user: result.user };
}

export function logoutSession(sessionOverride?: string | null) {
  return api.auth.logout(sessionOverride);
}

export async function fetchProfile(): Promise<UserProfileResponse> {
  return api.user.profile();
}

export async function fetchAirdropStatus(): Promise<AirdropStatusResponse> {
  return api.airdrop.status();
}

export async function reportUrl(url: string, reason: string) {
  try {
    await request(endpoints.scanReport, {
      method: "POST",
      body: JSON.stringify({ url, reason: normalizeReportReason(reason) })
    });
    return { queued: false, url, reason };
  } catch {
    return { queued: true, url, reason };
  }
}

export function checkReputation(url: string) {
  return api.checks.reputation(url);
}

export function traceRedirects(url: string) {
  return api.checks.redirects(url);
}

export function checkDomain(url: string) {
  return api.checks.domain(url);
}

export function checkCryptoPatterns(url: string) {
  return api.checks.cryptoPatterns(url);
}

export function fetchWalletStatus() {
  return api.wallet.status();
}

export function disconnectWallet() {
  return api.wallet.disconnect();
}

export function fetchReferralStatus() {
  return api.referral.stats();
}

export function requestWalletNonce(walletAddress: string) {
  return api.wallet.nonce(walletAddress);
}

export function verifyWallet(walletAddress: string, signature: string) {
  return api.wallet.verify(walletAddress, signature);
}

export function mockAnalyzeResponse(input: string): AnalyzeResponse {
  const normalized = input.trim() || "https://claim-sqr-airdrop.xyz/connect?approve=all";
  const suspicious = /airdrop|claim|drain|approve|wallet|\.xyz|bit\.ly|tinyurl|t\.co/i.test(normalized);
  const high = /drain|approve|wallet|\.xyz/i.test(normalized);
  const overallRisk: AnalyzeResponse["overallRisk"] = high ? "high" : suspicious ? "suspicious" : "safe";
  const confidenceScore = high ? 91 : suspicious ? 68 : 18;
  const signals: Signal[] = high
    ? [
        {
          check: "Domain Age",
          result: "8 days old",
          severity: "high",
          description: "Newly registered domains are often used for short-lived QR phishing campaigns.",
          passed: false
        },
        {
          check: "Wallet Drain Pattern",
          result: "Approval or wallet action detected",
          severity: "high",
          description: "The payload includes words commonly found in wallet-drain prompts, including approve, claim, or wallet connection language.",
          passed: false
        },
        {
          check: "Redirect Chain",
          result: "2 hops detected",
          severity: "medium",
          description: "Multiple redirects make it harder for users to understand the final destination before signing or paying.",
          passed: false
        },
        {
          check: "TLD Reputation",
          result: "Non-standard TLD",
          severity: "low",
          description: "The domain uses a TLD frequently seen in low-cost phishing infrastructure.",
          passed: false
        }
      ]
    : suspicious
      ? [
          {
            check: "Campaign Language",
            result: "Airdrop or claim terms found",
            severity: "medium",
            description: "Airdrop and claim language can be legitimate, but it deserves extra caution when delivered through a QR code.",
            passed: false
          },
          {
            check: "Redirect Chain",
            result: "No high-risk redirect pattern",
            severity: "low",
            description: "SafeScan did not detect a known URL shortener or suspicious final-domain swap in this demo pass.",
            passed: true
          }
        ]
      : [
          {
            check: "URL Format",
            result: "Valid HTTPS URL",
            severity: "low",
            description: "The payload uses a standard HTTPS URL and no wallet-drain keywords were detected in the mobile demo check.",
            passed: true
          }
        ];

  return {
    url: normalized,
    overallRisk,
    confidenceScore,
    verdict:
      overallRisk === "high"
        ? "This QR code shows strong indicators of a phishing or wallet-drain flow. Block it unless you independently trust the sender and destination."
        : overallRisk === "suspicious"
          ? "This QR code includes campaign-style language and should be reviewed before continuing. SafeScan recommends checking the destination and avoiding wallet approvals."
          : "This QR code does not show obvious high-risk signals in the mobile demo check. Continue only if the destination matches what you expected.",
    signals,
    scannedAt: new Date().toISOString()
  };
}
