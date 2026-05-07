import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { ReferralCard } from "@/components/shared/ReferralCard";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { useAuthStore } from "@/stores/authStore";
import { useScanStore } from "@/stores/scanStore";
import { theme } from "@/constants/theme";

const links = [
  ["Privacy Policy", "https://safescan-qr.onrender.com/legal/privacy-policy"],
  ["Terms of Use", "https://safescan-qr.onrender.com/legal/terms-of-use"],
  ["Cookie Policy", "https://safescan-qr.onrender.com/legal/cookie-policy"],
  ["Data Request", "https://safescan-qr.onrender.com/legal/data-request"],
  ["Security", "https://safescan-qr.onrender.com/security"],
  ["Contact", "mailto:privacy@safescan-qr.onrender.com"]
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const history = useScanStore((state) => state.history);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 28, gap: 18, paddingBottom: Math.max(insets.bottom, 20) + 36 }}>
      <View style={{ borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, backgroundColor: "rgba(10, 18, 33, 0.9)", padding: 16, gap: 12, ...theme.shadows.cardSubtle }}>
        <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.colors.primaryButtonText, fontSize: 22, fontFamily: theme.fonts.sansSemiBold }}>{(user?.name ?? "SS").slice(0, 2).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontFamily: theme.fonts.sansSemiBold }}>{user?.name ?? "Safe scanner"}</Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>{user?.email ?? "demo@safescan.app"}</Text>
        </View>
        {user?.role === "admin" ? (
          <View style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(124, 58, 237, 0.55)", borderRadius: 8, backgroundColor: "rgba(124, 58, 237, 0.16)", paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontFamily: theme.fonts.sansSemiBold, letterSpacing: 1 }}>ADMIN</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontFamily: theme.fonts.sansSemiBold }}>{history.length}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Scans</Text>
          </View>
          <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontFamily: theme.fonts.sansSemiBold }}>Referrer</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Tier</Text>
          </View>
        </View>
      </View>

      <ReferralCard />
      <WalletConnect />

      <View style={{ borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8, backgroundColor: theme.colors.surface, padding: 16, gap: 12 }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontFamily: theme.fonts.sansSemiBold }}>Important links</Text>
        {links.map(([label, href]) => (
          <Pressable key={label} accessibilityRole="link" onPress={() => Linking.openURL(href)} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.textSecondary }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Button title="Sign Out" variant="secondary" onPress={clearAuth} />
    </ScrollView>
  );
}
