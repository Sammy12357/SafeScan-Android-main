import { Text, View } from "react-native";
import { theme } from "@/constants/theme";
import type { Signal } from "@/services/api";

export function SeverityBadge({ severity }: { severity: Signal["severity"] }) {
  const color = severity === "high" ? theme.colors.danger : severity === "medium" ? theme.colors.suspicious : theme.colors.safe;
  return (
    <View accessibilityLabel={`${severity} severity signal`} style={{ borderRadius: 999, backgroundColor: color, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 11, fontWeight: "700" }}>{severity.toUpperCase()}</Text>
    </View>
  );
}
