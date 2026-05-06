import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { theme } from "@/constants/theme";

export default function GoogleAuthScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", padding: 16, gap: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontWeight: "700" }}>Continue to SafeScan</Text>
      <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>
        Google OAuth will use expo-auth-session and exchange the returned token with the SafeScan backend.
      </Text>
      <GoogleSignInButton />
      <Button title="Use demo mode" variant="secondary" />
    </View>
  );
}
