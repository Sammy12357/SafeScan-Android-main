import { LeaderboardResponseSchema } from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  list: "/api/leaderboard"
} as const;

export async function list(limit = 50) {
  // Auth is optional server-side; when a session is present the backend flags
  // the current user's row so the app can highlight it. request() attaches the
  // Bearer token automatically when we have one.
  const body = await request(`${paths.list}?limit=${encodeURIComponent(limit)}`);
  return parseResponse(LeaderboardResponseSchema, body);
}
