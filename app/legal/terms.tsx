import { ScrollView, Text } from "react-native";
import { theme } from "@/constants/theme";

export default function TermsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Terms of Use</Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 12, lineHeight: 22 }}>
        SafeScan QR provides informational risk analysis only. Verdicts are not guarantees of safety.
      </Text>
    </ScrollView>
  );
}
