import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RiskBreakdownPanel } from "@/components/risk/RiskBreakdownPanel";
import { theme } from "@/constants/theme";
import type { AnalyzeResponse } from "@/services/api";
import { useScanStore } from "@/stores/scanStore";

const demoResult: AnalyzeResponse = {
  scanId: "demo-risk-result",
  url: "https://claim-sqr-airdrop.xyz/connect?approve=all",
  riskScore: 91,
  verdict: "danger",
  verdictText: "This QR payload shows multiple high-risk signals including a new domain, redirect behavior, and wallet-drain style approval language.",
  analyzedAt: new Date().toISOString(),
  overallRisk: "high",
  confidenceScore: 91,
  counted: undefined,
  scanCount: undefined,
  payloadType: undefined,
  source: "demo-fallback",
  scannedAt: new Date().toISOString(),
  signals: [
    { label: "Domain Age", check: "Domain Age", result: "8 days old", severity: "high", description: "New domains are commonly used in phishing campaigns.", passed: false },
    { label: "Wallet Pattern", check: "Wallet Pattern", result: "approve=all", severity: "high", description: "The URL appears to request broad wallet approval before the user can inspect the action.", passed: false },
    { label: "Redirect Chain", check: "Redirect Chain", result: "2 hops detected", severity: "medium", description: "Extra redirects can hide the final destination.", passed: false }
  ]
};

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const result = useScanStore((state) => state.history.find((scan) => scan.id === id) ?? state.currentScan ?? demoResult);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 16) + 28, gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: theme.colors.accent, fontSize: 12, fontFamily: theme.fonts.sansSemiBold, letterSpacing: 1.8 }}>SCAN RESULT</Text>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontFamily: theme.fonts.sansSemiBold }}>Verdict detail</Text>
        <Text style={{ color: theme.colors.textSecondary }}>Result ID: {id}</Text>
      </View>
      <RiskBreakdownPanel result={result} />
    </ScrollView>
  );
}
