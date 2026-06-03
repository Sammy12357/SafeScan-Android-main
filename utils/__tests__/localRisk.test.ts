import { buildLocalOnlyAnalyzeResult, enhanceAnalyzeResult } from "@/utils/localRisk";
import { AnalyzeResultSchema } from "@/utils/schemas";

function makeBackendResult(overrides: Partial<Parameters<typeof enhanceAnalyzeResult>[0]> = {}) {
  return AnalyzeResultSchema.parse({
    url: "https://google.com",
    riskScore: 4,
    verdict: "safe",
    signals: [],
    analyzedAt: new Date().toISOString(),
    ...overrides
  });
}

describe("buildLocalOnlyAnalyzeResult", () => {
  it("flags wallet-drain language as danger", () => {
    const result = buildLocalOnlyAnalyzeResult("https://claim-airdrop.xyz/connect?approve=all");
    expect(result.verdict).toBe("danger");
    expect(result.riskScore).toBeGreaterThanOrEqual(75);
    expect(result.source).toBe("local-only");
    expect(result.signals[0].label).toBe("Offline analysis");
  });

  it("flags executable script payloads as danger", () => {
    const result = buildLocalOnlyAnalyzeResult("javascript:alert(document.cookie)");
    expect(result.verdict).toBe("danger");
    expect(
      result.signals.some((s) => /script|URI scheme/i.test(s.label))
    ).toBe(true);
  });

  it("rates a plain HTTPS URL on a trusted domain as safe", () => {
    const result = buildLocalOnlyAnalyzeResult("https://github.com/anthropics/claude-code");
    expect(result.verdict).toBe("safe");
    expect(result.riskScore).toBeLessThan(35);
  });

  it("always prepends the offline-analysis signal", () => {
    const result = buildLocalOnlyAnalyzeResult("https://example.com");
    expect(result.signals[0]).toMatchObject({
      label: "Offline analysis",
      severity: "medium"
    });
  });
});

describe("enhanceAnalyzeResult", () => {
  it("does not escalate a trusted domain on a generic redirect-chain warning", () => {
    const enhanced = enhanceAnalyzeResult(
      makeBackendResult({
        url: "https://youtu.be/abc",
        verdict: "warn",
        riskScore: 55,
        signals: [
          {
            label: "Redirect chain",
            check: "Redirect chain",
            result: "Intermediate domain differs.",
            severity: "high",
            description: "Domain differs from final destination.",
            passed: false
          }
        ]
      })
    );
    expect(enhanced.verdict).toBe("safe");
    expect(enhanced.riskScore).toBeLessThan(35);
  });

  it("escalates when local rules find a concrete brand-impersonation signal", () => {
    const enhanced = enhanceAnalyzeResult(
      makeBackendResult({
        url: "https://google-secure-login.tk/verify",
        verdict: "safe",
        riskScore: 5,
        signals: []
      })
    );
    expect(enhanced.verdict).toBe("danger");
    expect(enhanced.signals.some((s) => /brand/i.test(s.label))).toBe(true);
  });
});
