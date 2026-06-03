import {
  WalletConnectResponseSchema,
  WalletNonceResponseSchema,
  WalletStatusSchema
} from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  status: "/api/wallet",
  nonce: "/api/wallet/nonce",
  verify: "/api/wallet/verify",
  disconnect: "/api/wallet"
} as const;

export async function connect(publicKey: string) {
  const body = await request(paths.nonce, {
    method: "POST",
    body: JSON.stringify({ walletAddress: publicKey })
  });
  parseResponse(WalletNonceResponseSchema, body);
}

export async function status() {
  const body = await request(paths.status);
  return parseResponse(WalletStatusSchema, body);
}

export async function nonce(walletAddress: string) {
  const body = await request(paths.nonce, {
    method: "POST",
    body: JSON.stringify({ walletAddress })
  });
  return parseResponse(WalletNonceResponseSchema, body);
}

export async function verify(walletAddress: string, signature: string) {
  const body = await request(paths.verify, {
    method: "POST",
    body: JSON.stringify({ walletAddress, signature })
  });
  return parseResponse(WalletConnectResponseSchema, body);
}

export async function disconnect() {
  const body = await request(paths.disconnect, { method: "DELETE" });
  return parseResponse(WalletConnectResponseSchema, body);
}
