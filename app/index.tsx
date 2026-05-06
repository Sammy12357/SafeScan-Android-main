import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { colors, spacing, theme, typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";

const stats = [
  { icon: "cpu", label: "AI Risk Verdicts" },
  { icon: "maximize-2", label: "ZBar QR Decoding" },
  { icon: "gift", label: "SQR Reward Tiers" }
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const { setSession, setUser } = useAuthStore();

  const startDemo = async () => {
    await setSession("demo-session");
    await setUser({ id: "demo", name: "Safe scanner", email: "demo@safescan.app" });
    router.replace("/(tabs)/scanner");
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.screenPad, paddingVertical: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primaryDim, borderRadius: spacing.badgeRadius, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 24 }}>
            <Feather name="shield" size={12} color={colors.primaryLight} style={{ marginRight: 6 }} />
            <Text style={{ ...typography.badge, color: colors.primaryLight }}>QR SECURITY SCANNER</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Feather name="shield" size={28} color={colors.primaryLight} style={{ marginRight: 10 }} />
            <Text style={{ ...typography.h1, fontSize: 36, textAlign: "center" }}>SafeScan QR</Text>
          </View>

          <Text style={{ ...typography.body, fontSize: 16, textAlign: "center", maxWidth: 320, marginBottom: 36 }}>
            A trust layer for QR links, wallet prompts, and payment redirects.
          </Text>

          <View style={{ flexDirection: "row", marginBottom: 40, width: "100%" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Button title="Scan QR" onPress={startDemo} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Analyze Payload" variant="secondary" onPress={startDemo} />
            </View>
          </View>

          <View style={{ flexDirection: "row", width: "100%" }}>
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: spacing.cardRadius,
                  borderWidth: 1,
                  borderColor: colors.surfaceBorder,
                  padding: 12,
                  alignItems: "center",
                  marginRight: index === stats.length - 1 ? 0 : 12,
                  ...theme.shadows.cardSubtle
                }}
              >
                <Feather name={stat.icon} size={18} color={colors.accent} style={{ marginBottom: 6 }} />
                <Text style={{ ...typography.label, textAlign: "center", lineHeight: 16 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
