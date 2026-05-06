import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";

export function ScanDrawer({ payload, onClear }: { payload: string | null; onClear: () => void }) {
  if (!payload) return null;

  return (
    <View style={{ position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, gap: 10 }}>
      <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>QR detected</Text>
      <Text numberOfLines={2} style={{ color: theme.colors.textSecondary }}>{payload}</Text>
      <Button title="Analyze" />
      <Button title="Scan another" variant="secondary" onPress={onClear} />
    </View>
  );
}
