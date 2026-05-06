import { View } from "react-native";
import { theme } from "@/constants/theme";

export function ScanOverlay({ detected }: { detected: boolean }) {
  const color = detected ? theme.colors.safe : theme.colors.accent;
  return (
    <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 260, height: 260, borderColor: color, borderWidth: 2, borderRadius: 24, opacity: 0.9 }} />
    </View>
  );
}
