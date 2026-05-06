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
  scannedAt: z.string()
});

export type Signal = z.infer<typeof SignalSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

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
  const json = await apiFetch("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
    timeoutMs: config.analyzeTimeoutMs
  });
  return AnalyzeResponseSchema.parse(json);
}

export async function verifyGoogleToken(token: string) {
  return apiFetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function fetchProfile() {
  return apiFetch("/api/user/profile", { method: "GET" });
}

export async function fetchAirdropStatus() {
  return apiFetch("/api/airdrop/status", { method: "GET" });
}

export async function reportUrl(url: string, reason: string) {
  return apiFetch("/api/report", {
    method: "POST",
    body: JSON.stringify({ url, reason })
  });
}
