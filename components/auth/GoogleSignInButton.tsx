import { Pressable, Text, View } from "react-native";
import { theme } from "@/constants/theme";

export function GoogleSignInButton({ onPress, disabled = false }: { onPress?: () => void; disabled?: boolean }) {
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={{ minHeight: 44, borderRadius: 12, backgroundColor: "#05070b", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.18)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, opacity: disabled ? 0.55 : 1 }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#4285f4", fontSize: 16, fontFamily: theme.fonts.sansSemiBold }}>G</Text>
        </View>
        <Text style={{ color: "#f8fafc", fontFamily: theme.fonts.sansMedium }}>Sign in with Google</Text>
      </Pressable>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Opens Google's secure sign-in prompt.</Text>
    </View>
  );
}
