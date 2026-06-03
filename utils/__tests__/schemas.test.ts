import {
  AirdropStatusSchema,
  AnalyzeResultSchema,
  AuthResponseSchema,
  ScanHistoryItemSchema,
  SignalSchema,
  TokenPairSchema,
  UserSchema
} from "@/utils/schemas";

describe("UserSchema", () => {
  it("falls back to email-derived name when name is missing", () => {
    const parsed = UserSchema.parse({ email: "alex@example.com" });
    expect(parsed.email).toBe("alex@example.com");
    expect(parsed.name).toBe("alex");
    expect(parsed.id).toBe("alex@example.com");
  });

  it("preserves explicit name and picture into avatarUrl", () => {
    const parsed = UserSchema.parse({
      id: "u-1",
      email: "kim@example.com",
      name: "Kim",
      picture: "https://example.com/k.png"
    });
    expect(parsed.id).toBe("u-1");
    expect(parsed.name).toBe("Kim");
    expect(parsed.avatarUrl).toBe("https://example.com/k.png");
  });

  it("rejects invalid email", () => {
    expect(() => UserSchema.parse({ email: "not-an-email" })).toThrow();
  });
});

describe("SignalSchema", () => {
  it("fills missing label/check/description from siblings", () => {
    const parsed = SignalSchema.parse({ severity: "high", result: "Punycode host" });
    expect(parsed.label).toBe("Signal");
    expect(parsed.check).toBe("Signal");
    expect(parsed.result).toBe("Punycode host");
    expect(parsed.description).toBe("Punycode host");
  });

  it("rejects unknown severity", () => {
    expect(() => SignalSchema.parse({ severity: "critical" })).toThrow();
  });
});

describe("AnalyzeResultSchema", () => {
  it("derives verdict from riskScore when verdict missing", () => {
    const parsed = AnalyzeResultSchema.parse({
      url: "https://safescan.example",
      riskScore: 12,
      signals: []
    });
    expect(parsed.verdict).toBe("safe");
    expect(parsed.overallRisk).toBe("safe");
    expect(parsed.confidenceScore).toBe(12);
  });

  it("maps legacy overallRisk to verdict when verdict missing", () => {
    const parsed = AnalyzeResultSchema.parse({
      url: "https://x.test",
      overallRisk: "high",
      signals: []
    });
    expect(parsed.verdict).toBe("danger");
  });

  it("synthesizes scanId from url+analyzedAt when missing", () => {
    const parsed = AnalyzeResultSchema.parse({
      url: "https://a.test",
      signals: [],
      analyzedAt: "2026-01-01T00:00:00Z"
    });
    expect(parsed.scanId).toBe("https://a.test:2026-01-01T00:00:00Z");
  });
});

describe("ScanHistoryItemSchema", () => {
  it("accepts snake_case backend fields and normalizes", () => {
    const parsed = ScanHistoryItemSchema.parse({
      url: "https://b.test",
      verdict: "warn",
      risk_score: 55,
      created_at: "2026-02-02T00:00:00Z"
    });
    expect(parsed.riskScore).toBe(55);
    expect(parsed.analyzedAt).toBe("2026-02-02T00:00:00Z");
    expect(parsed.scannedAt).toBe("2026-02-02T00:00:00Z");
    expect(parsed.reported).toBe(false);
  });
});

describe("AuthResponseSchema", () => {
  it("falls back to session as accessToken when accessToken missing", () => {
    const parsed = AuthResponseSchema.parse({
      session: "sess-token",
      user: { email: "u@example.com" }
    });
    expect(parsed.accessToken).toBe("sess-token");
    expect(parsed.refreshToken).toBe("sess-token");
  });
});

describe("TokenPairSchema", () => {
  it("requires both tokens", () => {
    expect(() => TokenPairSchema.parse({ accessToken: "a" })).toThrow();
    expect(TokenPairSchema.parse({ accessToken: "a", refreshToken: "r" })).toEqual({
      accessToken: "a",
      refreshToken: "r"
    });
  });
});

describe("AirdropStatusSchema", () => {
  it("derives tier from currentTier name when tier number missing", () => {
    const parsed = AirdropStatusSchema.parse({ currentTier: "Guardian", totalScans: 120 });
    expect(parsed.tier).toBe(3);
    expect(parsed.totalScans).toBe(120);
    expect(parsed.nextTierAt).toBeGreaterThan(0);
  });

  it("defaults missing fields without throwing", () => {
    const parsed = AirdropStatusSchema.parse({});
    expect(parsed.tier).toBe(1);
    expect(parsed.airdropStatus).toBe("eligible");
    expect(parsed.walletConnected).toBe(false);
  });
});
