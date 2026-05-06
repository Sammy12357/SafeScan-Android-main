import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { SignalAccordion } from "@/components/risk/SignalAccordion";
import type { AnalyzeResponse } from "@/services/api";
import { theme } from "@/constants/theme";

const severityRank = { high: 0, medium: 1, low: 2 };

export function RiskBreakdownPanel({ result }: { result: AnalyzeResponse }) {
  const signals = [...result.signals].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ alignItems: "center" }}>
        <RiskGauge score={result.confidenceScore} />
      </View>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "700" }}>{result.overallRisk.toUpperCase()}</Text>
      <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>{result.verdict}</Text>
      {signals.map((signal) => (
        <SignalAccordion key={`${signal.check}-${signal.result}`} signal={signal} />
      ))}
    </Card>
  );
}
