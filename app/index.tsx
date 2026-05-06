import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";
import { config } from "@/constants/config";

export default function LandingScreen() {
  return (
    <LinearGradient colors={[theme.colors.background, "#1a0a2e"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: "center" }}>
        <View style={{ gap: 18 }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 44, fontWeight: "700" }}>
            SafeScan QR
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 18, lineHeight: 28 }}>
            Scan-before-you-sign protection for QR codes, wallet links, and Solana payment flows.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {["AI verdicts", "QR scanner", "SQR tiers"].map((label) => (
              <View key={label} style={{ borderColor: theme.colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: theme.colors.accent }}>{label}</Text>
              </View>
            ))}
          </View>
          <Link href="/auth/google" asChild>
            <Button title="Continue with Google" />
          </Link>
          <Text style={{ color: theme.colors.muted }}>Beta · {config.appVersion}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
