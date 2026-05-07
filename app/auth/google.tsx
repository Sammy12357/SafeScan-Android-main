import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { config } from "@/constants/config";
import { theme } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: config.googleWebClientId || undefined,
    androidClientId: config.googleAndroidClientId || undefined,
    scopes: ["openid", "profile", "email"],
    selectAccount: true
  });

  useEffect(() => {
    const finishGoogleSignIn = async () => {
      if (response?.type !== "success") {
        if (response?.type === "error") setAuthError("Google sign-in did not complete. Please try again.");
        return;
      }

      const idToken = response.params.id_token;
      if (!idToken) {
        setAuthError("Google did not return an ID token. Check the OAuth client configuration.");
        setIsSigningIn(false);
        return;
      }

      try {
        await loginWithGoogle(idToken);
        router.replace("/(tabs)/scanner");
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "SafeScan sign-in failed.");
      } finally {
        setIsSigningIn(false);
      }
    };

    finishGoogleSignIn();
  }, [loginWithGoogle, response, router]);

  const startGoogleSignIn = async () => {
    setAuthError("");
    if (!config.hasGoogleClientId) {
      setAuthError("Google sign-in needs a real OAuth client ID in .env. Replace YOUR_GOOGLE_WEB_CLIENT_ID, then restart Expo with --clear.");
      return;
    }
    if (!request) {
      setAuthError("Google sign-in is still loading. Try again in a moment.");
      return;
    }
    setIsSigningIn(true);
    const result = await promptAsync();
    if (result.type !== "success") setIsSigningIn(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", paddingHorizontal: 16, paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
      <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.surface, padding: 22, gap: 16, ...theme.shadows.panel }}>
        <Text style={{ color: theme.colors.accent, fontSize: 12, fontFamily: theme.fonts.sansSemiBold, letterSpacing: 1.8 }}>SAFESCAN QR</Text>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 34, fontFamily: theme.fonts.sansSemiBold, lineHeight: 38 }}>Continue to SafeScan</Text>
        <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>
          Sign in with Google to connect the app to the live SafeScan backend, or use demo mode for a local preview.
        </Text>
        <GoogleSignInButton onPress={startGoogleSignIn} disabled={isSigningIn} />
        {authError ? <Text style={{ color: theme.colors.danger, fontSize: 12, lineHeight: 18 }}>{authError}</Text> : null}
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
          By signing up, you agree to SafeScan's Terms and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}
