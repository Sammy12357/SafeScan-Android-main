import type { AnalyzeResponse, Signal } from "@/utils/schemas";
import { enhanceAnalyzeResult } from "@/utils/localRisk";

export function mockAnalyzeResponse(input: string): AnalyzeResponse {
  const normalized = input.trim() || "https://claim-sqr-airdrop.xyz/connect?approve=all";
  const suspicious = /airdrop|claim|drain|approve|wallet|\.xyz|bit\.ly|tinyurl|t\.co/i.test(normalized);
  const high = /drain|approve|wallet|\.xyz/i.test(normalized);
  const overallRisk: AnalyzeResponse["overallRisk"] = high ? "high" : suspicious ? "suspicious" : "safe";
  const confidenceScore = high ? 91 : suspicious ? 68 : 18;
  const signals: Signal[] = high
    ? [
        {
          label: "Domain Age",
          check: "Domain Age",
          result: "8 days old",
          severity: "high",
          description: "Newly registered domains are often used for short-lived QR phishing campaigns.",
          passed: false
        },
        {
          label: "Wallet Drain Pattern",
          check: "Wallet Drain Pattern",
          result: "Approval or wallet action detected",
          severity: "high",
          description: "The payload includes words commonly found in wallet-drain prompts, including approve, claim, or wallet connection language.",
          passed: false
        },
        {
          label: "Redirect Chain",
          check: "Redirect Chain",
          result: "2 hops detected",
          severity: "medium",
          description: "Multiple redirects make it harder for users to understand the final destination before signing or paying.",
          passed: false
        },
        {
          label: "TLD Reputation",
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
            label: "Campaign Language",
            check: "Campaign Language",
            result: "Airdrop or claim terms found",
            severity: "medium",
            description: "Airdrop and claim language can be legitimate, but it deserves extra caution when delivered through a QR code.",
            passed: false
          },
          {
            label: "Redirect Chain",
            check: "Redirect Chain",
            result: "No high-risk redirect pattern",
            severity: "low",
            description: "SafeScan did not detect a known URL shortener or suspicious final-domain swap in this demo pass.",
            passed: true
          }
        ]
      : [
          {
            label: "URL Format",
            check: "URL Format",
            result: "Valid HTTPS URL",
            severity: "low",
            description: "The payload uses a standard HTTPS URL and no wallet-drain keywords were detected in the mobile demo check.",
            passed: true
          }
        ];

  return enhanceAnalyzeResult({
    scanId: `mock:${normalized}`,
    url: normalized,
    riskScore: confidenceScore,
    verdict: overallRisk === "high" ? "danger" : overallRisk === "suspicious" ? "warn" : "safe",
    verdictText:
      overallRisk === "high"
        ? "This QR code shows strong indicators of a phishing or wallet-drain flow. Block it unless you independently trust the sender and destination."
        : overallRisk === "suspicious"
          ? "This QR code includes campaign-style language and should be reviewed before continuing. SafeScan recommends checking the destination and avoiding wallet approvals."
          : "This QR code does not show obvious high-risk signals in the mobile demo check. Continue only if the destination matches what you expected.",
    analyzedAt: new Date().toISOString(),
    overallRisk,
    confidenceScore,
    counted: undefined,
    scanCount: undefined,
    payloadType: undefined,
    source: "demo-fallback",
    signals,
    scannedAt: new Date().toISOString()
  });
}
