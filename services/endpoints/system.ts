import { UnknownResponseSchema } from "@/utils/schemas";
import { parseResponse, request, SafeScanApiError } from "@/services/apiClient";

const paths = {
  health: "/api/health",
  wakeAnalyze: "/api/analyze"
} as const;

export async function health() {
  try {
    const body = await request(paths.health, {
      method: "GET",
      auth: false,
      retry: false,
      timeoutMs: 5000
    });
    parseResponse(UnknownResponseSchema, body);
    return true;
  } catch (error) {
    if (error instanceof SafeScanApiError && error.status === 404) return false;
    throw error;
  }
}

export async function wakeAnalyze(url: string) {
  const body = await request(paths.wakeAnalyze, {
    method: "POST",
    auth: false,
    retry: false,
    timeoutMs: 5000,
    body: JSON.stringify({ url })
  });
  parseResponse(UnknownResponseSchema, body);
}
