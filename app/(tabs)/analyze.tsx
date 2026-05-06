import { useState } from "react";
import { Text, View } from "react-native";
import { useAnalyze } from "@/hooks/useAnalyze";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RiskBreakdownPanel } from "@/components/risk/RiskBreakdownPanel";
import { ServerWakeBanner } from "@/components/shared/ServerWakeBanner";
import { theme } from "@/constants/theme";

export default function AnalyzeScreen() {
  const [url, setUrl] = useState("");
  const analyze = useAnalyze();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16, gap: 16 }}>
      <ServerWakeBanner active={analyze.isPending} />
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Analyze Payload</Text>
      <Input value={url} onChangeText={setUrl} placeholder="https://example.com" autoCapitalize="none" keyboardType="url" />
      <Button title="Analyze URL" onPress={() => analyze.mutate(url)} disabled={!url || analyze.isPending} />
      {analyze.data ? <RiskBreakdownPanel result={analyze.data} /> : null}
    </View>
  );
}
