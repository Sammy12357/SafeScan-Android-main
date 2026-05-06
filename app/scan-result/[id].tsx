import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { theme } from "@/constants/theme";

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Scan Result</Text>
      <Text style={{ color: theme.colors.textSecondary }}>Result ID: {id}</Text>
    </View>
  );
}
