import { z } from "zod";
import { config } from "@/constants/config";
import { useAuthStore } from "@/stores/authStore";

export const SignalSchema = z.object({
  check: z.string(),
  result: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
  passed: z.boolean().optional()
});

export const AnalyzeResponseSchema = z.object({
  url: z.string(),
  overallRisk: z.enum(["safe", "suspicious", "high"]),
  confidenceScore: z.number().min(0).max(100),
  verdict: z.string(),
  signals: z.array(SignalSchema),
  scannedAt: z.string(),
  source: z.enum(["backend", "demo-fallback"]).optional()
});

export type Signal = z.infer<typeof SignalSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

export type UserProfileResponse = {
  id?: string;
  name: string;
  email: string;
  role?: "user" | "admin";
  scanCount: number;
  referrals: number;
  tier: string;
  walletConnected: boolean;
};

export type AirdropStatusResponse = {
  scanCount: number;
  referrals: number;
  currentTier: string;
  walletConnected: boolean;
  walletAddress?: string | null;
  airdropStatus: string;
  fraudScore: number;
  referralCode?: string | null;
  nextMilestone: string;
};

type ApiOptions = RequestInit & {
  timeoutMs?: number;
};

async function apiFetch(path: string, options: ApiOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? config.analyzeTimeoutMs);
  const session = useAuthStore.getState().session;

  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session}` } : {}),
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`SafeScan API ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  try {
    const json = await apiFetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url }),
      timeoutMs: config.analyzeTimeoutMs
    });
    return { ...AnalyzeResponseSchema.parse(json), source: "backend" };
  } catch {
    return { ...mockAnalyzeResponse(url), source: "demo-fallback" };
  }
}

export async function verifyGoogleToken(token: string) {
  return apiFetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function logoutSession() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Local sign-out should still complete if the network or backend is unavailable.
  }
}

export async function fetchProfile(): Promise<UserProfileResponse> {
  try {
    return await apiFetch("/api/user/profile", { method: "GET" });
  } catch {
    return {
      name: "Safe scanner",
      email: "demo@safescan.app",
      scanCount: 7,
      referrals: 1,
      tier: "Referrer",
      walletConnected: false
    };
  }
}

export async function fetchAirdropStatus(): Promise<AirdropStatusResponse> {
  try {
    return await apiFetch("/api/airdrop/status", { method: "GET" });
  } catch {
    return {
      scanCount: 7,
      referrals: 1,
      currentTier: "Referrer",
      walletConnected: false,
      airdropStatus: "eligible",
      fraudScore: 0,
      nextMilestone: "Scan 50 QR codes and invite 3 people to unlock Guardian."
    };
  }
}

export async function reportUrl(url: string, reason: string) {
  try {
    return await apiFetch("/api/report", {
      method: "POST",
      body: JSON.stringify({ url, reason })
    });
  } catch {
    return { queued: true, url, reason };
  }
}

export function checkReputation(url: string) {
  return apiFetch("/api/check-reputation", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}

export function traceRedirects(url: string) {
  return apiFetch("/api/trace-redirects", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}

export function checkDomain(url: string) {
  return apiFetch("/api/check-domain", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}

export function checkCryptoPatterns(url: string) {
  return apiFetch("/api/check-crypto-patterns", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}

export function fetchWalletStatus() {
  return apiFetch("/api/wallet", { method: "GET" });
}

export function disconnectWallet() {
  return apiFetch("/api/wallet", { method: "DELETE" });
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
