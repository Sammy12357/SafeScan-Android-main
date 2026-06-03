import { AuthResponseSchema, EmptyResponseSchema, TokenPairSchema } from "@/utils/schemas";
import { clearApiTokens, parseResponse, request, setApiTokens } from "@/services/apiClient";

const paths = {
  verify: "/auth/verify",
  refresh: "/auth/refresh",
  logout: "/auth/logout"
} as const;

export async function verifyToken(idToken: string) {
  const body = await request(paths.verify, {
    method: "POST",
    auth: false,
    body: JSON.stringify({ token: idToken })
  });
  const result = parseResponse(AuthResponseSchema, body);
  setApiTokens(result);
  return result;
}

export async function refreshToken(refreshTokenValue: string) {
  const body = await request(paths.refresh, {
    method: "POST",
    auth: false,
    retry: false,
    body: JSON.stringify({ refreshToken: refreshTokenValue })
  });
  const result = parseResponse(TokenPairSchema, body);
  setApiTokens(result);
  return result;
}

export async function logout(sessionOverride?: string | null) {
  const headers = new Headers();
  if (sessionOverride) headers.set("Authorization", `Bearer ${sessionOverride}`);
  try {
    const body = await request(paths.logout, {
      method: "POST",
      headers,
      retry: false
    });
    parseResponse(EmptyResponseSchema, body);
  } finally {
    clearApiTokens();
  }
}
