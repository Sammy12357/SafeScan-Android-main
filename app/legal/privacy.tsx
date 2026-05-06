import { ScrollView, Text } from "react-native";
import { theme } from "@/constants/theme";

export default function PrivacyScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Privacy Policy</Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 12, lineHeight: 22 }}>
        SafeScan QR analyzes QR payloads for security risk, uses Google OAuth for authentication, and stores only the data required to provide the service.
      </Text>
    </ScrollView>
  );
}
