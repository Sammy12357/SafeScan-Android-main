import { AntDesign } from "@expo/vector-icons";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

export default function GoogleAuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, isLoading, error } = useGoogleAuth();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: insets.top + 28,
        paddingBottom: Math.max(insets.bottom, 16) + 16,
        gap: 24
      }}
    >
      <View style={{ alignItems: "center", gap: 14 }}>
        <Image source={require("../../assets/images/icon.png")} style={{ width: 88, height: 88, borderRadius: 22 }} />
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontFamily: theme.fonts.sansSemiBold, letterSpacing: 1.8 }}>SAFESCAN QR</Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontFamily: theme.fonts.sansSemiBold, textAlign: "center" }}>Continue to SafeScan</Text>
        </View>
      </View>

      <View style={{ width: "100%", gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={signIn}
          style={({ pressed }) => ({
            minHeight: 50,
            borderRadius: 8,
            backgroundColor: theme.colors.textPrimary,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: isLoading ? 0.65 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          })}
        >
          <AntDesign name="google" size={20} color={theme.colors.backgroundEnd} />
          <Text style={{ color: theme.colors.backgroundEnd, fontFamily: theme.fonts.sansSemiBold, fontSize: 15 }}>Sign in with Google</Text>
        </Pressable>

        {isLoading ? <ActivityIndicator color={theme.colors.accent} /> : null}
        {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, lineHeight: 19, textAlign: "center" }}>{error}</Text> : null}
      </View>
    </View>
  );
}
