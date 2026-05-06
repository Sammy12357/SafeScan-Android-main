import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ReferralCard } from "@/components/shared/ReferralCard";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/constants/theme";

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16, gap: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>Profile</Text>
      <Text style={{ color: theme.colors.textSecondary }}>{user?.email ?? "Not signed in"}</Text>
      <ReferralCard />
      <Button title="Sign out" variant="secondary" onPress={clearAuth} />
    </View>
  );
}
