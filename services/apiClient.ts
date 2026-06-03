import { z } from "zod";
import { TokenPairSchema, type TokenPair } from "@/utils/schemas";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://safescan-qr.onrender.com";
export const DEFAULT_TIMEOUT_MS = 60000;

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;
let tokenPersister: ((tokens: TokenPair) => void) | null = null;

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

export class SafeScanApiError extends Error implements ApiError {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(formatApiErrorMessage(status, body));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
  timeoutMs?: number;
};

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function summarizeDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item || typeof item !== "object") return undefined;
        const message = "msg" in item ? (item as { msg?: unknown }).msg : undefined;
        return typeof message === "string" ? message : undefined;
      })
      .filter(Boolean)
      .join("; ");
  }
  return undefined;
}

function formatApiErrorMessage(status: number, body: unknown) {
  if (typeof body === "string" && body.trim()) return `SafeScan API ${status}: ${body.trim().slice(0, 180)}`;
  if (body && typeof body === "object") {
    const detail = "detail" in body ? (body as { detail?: unknown }).detail : undefined;
    const error = "error" in body ? (body as { error?: unknown }).error : undefined;
    const message = "message" in body ? (body as { message?: unknown }).message : undefined;
    const summary = error ?? message ?? summarizeDetail(detail);
    if (summary) return `SafeScan API ${status}: ${summary}`;
  }
  return `SafeScan API ${status}`;
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function setApiTokens(tokens: Partial<TokenPair>) {
  if (tokens.accessToken !== undefined) accessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) refreshTokenValue = tokens.refreshToken;
}

export function clearApiTokens() {
  accessToken = null;
  refreshTokenValue = null;
}

export function getApiAccessToken() {
  return accessToken;
}

/**
 * Registered by the auth store at startup so silent refreshes inside
 * request() persist the new tokens to SecureStore. Without this, an in-flight
 * refresh would update the in-memory cache only and the next cold start would
 * rehydrate the stale access token.
 */
export function setTokenPersister(persister: ((tokens: TokenPair) => void) | null) {
  tokenPersister = persister;
}

export function parseResponse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) throw new SafeScanApiError(422, error.flatten());
    throw error;
  }
}

async function refreshAccessToken() {
  if (!refreshTokenValue) throw new SafeScanApiError(401, { error: "Missing refresh token" });

  const body = await request("/auth/refresh", {
    method: "POST",
    auth: false,
    retry: false,
    body: JSON.stringify({ refreshToken: refreshTokenValue })
  });
  const tokens = parseResponse(TokenPairSchema, body);
  setApiTokens(tokens);
  if (tokenPersister) {
    try {
      tokenPersister(tokens);
    } catch {
      // never let persistence failures abort the auth flow
    }
  }
  return tokens;
}

export async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      signal: controller.signal,
      headers
    });

    if (response.status === 401 && options.auth !== false && options.retry !== false) {
      await refreshAccessToken();
      return request(path, { ...options, retry: false });
    }

    const body = await readBody(response);
    if (!response.ok) throw new SafeScanApiError(response.status, body);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Multipart upload helper. Takes a factory so retries (after silent refresh)
 * can rebuild the FormData — React Native's FormData can't be reused after a
 * fetch has consumed it.
 */
export async function uploadRequest(
  path: string,
  formFactory: () => FormData,
  options: { retry?: boolean; auth?: boolean } = {}
): Promise<unknown> {
  const headers = new Headers();
  if (options.auth !== false && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers,
    body: formFactory()
  });

  const responseBody = await readBody(response);

  if (response.status === 401 && options.auth !== false && refreshTokenValue && options.retry !== false) {
    await refreshAccessToken();
    return uploadRequest(path, formFactory, { ...options, retry: false });
  }
  if (!response.ok) throw new SafeScanApiError(response.status, responseBody);
  return responseBody;
}

export { readBody };
