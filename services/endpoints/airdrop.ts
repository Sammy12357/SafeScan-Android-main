import { AirdropStatusSchema } from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  status: "/api/airdrop/status"
} as const;

export async function status() {
  const body = await request(paths.status);
  return parseResponse(AirdropStatusSchema, body);
}
