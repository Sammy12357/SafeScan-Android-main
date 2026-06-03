import { EmptyResponseSchema, UserProfileSchema } from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  profile: "/api/user/profile",
  delete: "/api/user"
} as const;

export async function profile() {
  const body = await request(paths.profile);
  return parseResponse(UserProfileSchema, body);
}

export async function deleteAccount() {
  const body = await request(paths.delete, { method: "DELETE" });
  parseResponse(EmptyResponseSchema, body);
}
