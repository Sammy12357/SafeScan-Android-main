import { useCallback, useState } from "react";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/stores/authStore";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "dev-vnllaqnkkegs4xni.us.auth0.com";
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? "1XfWxWOtDtN18JCCztRehzcJ1jOSBBic";
const EXPO_PROXY_USERNAME = process.env.EXPO_PUBLIC_EXPO_PROXY_USERNAME ?? "fellowbeast";
const EXPO_PROXY_SLUG = process.env.EXPO_PUBLIC_EXPO_PROXY_SLUG ?? "safescan-android";
const EXPO_GO_AUTH0_REDIRECT_URI = `https://auth.expo.io/@${EXPO_PROXY_USERNAME}/${EXPO_PROXY_SLUG}/`;
const EXPO_PROXY_START_URL = `https://auth.expo.io/@${EXPO_PROXY_USERNAME}/${EXPO_PROXY_SLUG}/start`;

function decodeIdTokenClaims(idToken: string): {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  nonce?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
} | null {
  try {
    const b64 = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function getAuthParam(url: string, key: string) {
  const queryString = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
  const hashString = url.includes("#") ? url.split("#")[1] : "";
  return new URLSearchParams(queryString).get(key) ?? new URLSearchParams(hashString).get(key);
}

function randomToken(byteLength = 32) {
  const bytes = Crypto.getRandomBytes(byteLength);
  // base64url, RFC 4648
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function audMatches(claim: string | string[] | undefined, expected: string) {
  if (!claim) return false;
  return Array.isArray(claim) ? claim.includes(expected) : claim === expected;
}

function getExpoHostUri() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;

  return hostUri?.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\/$/, "");
}

function getAuthRedirectUri() {
  if (Constants.executionEnvironment === "storeClient") {
    return EXPO_GO_AUTH0_REDIRECT_URI;
  }

  const hostUri = getExpoHostUri();
  if (hostUri) return `exp://${hostUri}/--/auth`;
  return AuthSession.makeRedirectUri({
    path: "auth"
  });
}

// Auth0 Universal Login pre-targeted at Google. The flow is:
//   1. Auth0 returns Credentials with an idToken (JWT signed by SafeScan tenant).
//   2. We exchange that idToken at the backend's /auth/verify, which mints a
//      SafeScan session. ON SUCCESS, the auth store flips isAuthenticated=true
//      AND seeds the API access token in one atomic update — no race.
//   3. If the backend exchange fails (Render cold-start, not yet redeployed,
//      offline, etc.) we fall back to a local-only auth so the user isn't
//      locked out of the UI. They get a visible error and `hasBackendSession`
//      stays false until a future exchange succeeds.
//
// Critically: we do NOT mirror Auth0's `user` into our store via a useEffect.
// That earlier pattern flipped isAuthenticated=true while the exchange was
// still in flight, which let routing redirect into screens that immediately
// fired protected requests with no Authorization header — the source of the
// "401 in analyze and airdrop" reports.
export function useGoogleAuth() {
  const loginWithAuth0 = useAuthStore((state) => state.loginWithAuth0);
  const exchangeAuth0IdToken = useAuthStore((state) => state.exchangeAuth0IdToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const redirectUri = getAuthRedirectUri();
      const nonce = randomToken();
      const state = randomToken();
      const authUrl =
        `https://${AUTH0_DOMAIN}/authorize?` +
        new URLSearchParams({
          client_id: AUTH0_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: "id_token",
          scope: "openid profile email",
          connection: "google-oauth2",
          nonce,
          state
        }).toString();

      const returnUrl = Constants.executionEnvironment === "storeClient" ? AuthSession.getDefaultReturnUrl() : redirectUri;
      const browserUrl =
        Constants.executionEnvironment === "storeClient"
          ? `${EXPO_PROXY_START_URL}?${new URLSearchParams({ authUrl, returnUrl }).toString()}`
          : authUrl;

      const result = await WebBrowser.openAuthSessionAsync(browserUrl, returnUrl);
      if (result.type !== "success") {
        if (result.type === "cancel") setError("Sign-in was cancelled.");
        return;
      }

      const returnedState = getAuthParam(result.url, "state");
      if (returnedState !== state) {
        setError("Sign-in failed: state mismatch. Please try again.");
        return;
      }

      const idToken = getAuthParam(result.url, "id_token");
      if (!idToken) {
        setError("Auth0 did not return an ID token.");
        return;
      }

      const claims = decodeIdTokenClaims(idToken);
      if (!claims) {
        setError("Auth0 returned an unparseable ID token.");
        return;
      }
      if (claims.nonce !== nonce) {
        setError("Sign-in failed: nonce mismatch. Please try again.");
        return;
      }
      if (!audMatches(claims.aud, AUTH0_CLIENT_ID)) {
        setError("Sign-in failed: ID token audience mismatch.");
        return;
      }
      if (claims.iss && !claims.iss.includes(AUTH0_DOMAIN)) {
        setError("Sign-in failed: ID token issuer mismatch.");
        return;
      }
      if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
        setError("Sign-in failed: ID token expired before we could exchange it.");
        return;
      }

      try {
        await exchangeAuth0IdToken(idToken);
      } catch (exchangeError) {
        // Backend exchange failed. Fall back to local-only auth so the user
        // can still see the UI; protected calls will stay 401 until backend
        // is reachable AND has the Auth0-aware /auth/verify deployed.
        if (claims?.email) {
          loginWithAuth0({
            sub: claims.sub,
            email: claims.email,
            name: claims.name,
            picture: claims.picture,
          });
        }
        setError(
          exchangeError instanceof Error
            ? `Signed in locally — backend session unavailable: ${exchangeError.message}`
            : "Signed in locally — SafeScan backend rejected the login."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [exchangeAuth0IdToken, loginWithAuth0]);

  return {
    signIn,
    isLoading,
    error,
  };
}
