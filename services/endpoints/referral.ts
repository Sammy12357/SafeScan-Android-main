import { ReferralStatsSchema } from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  stats: "/api/referral"
} as const;

export async function stats() {
  const body = await request(paths.stats);
  return parseResponse(ReferralStatsSchema, body);
}
