import { UnknownResponseSchema } from "@/utils/schemas";
import { parseResponse, request } from "@/services/apiClient";

const paths = {
  reputation: "/api/check-reputation",
  redirects: "/api/trace-redirects",
  domain: "/api/check-domain",
  cryptoPatterns: "/api/check-crypto-patterns"
} as const;

async function post(path: string, url: string) {
  const body = await request(path, {
    method: "POST",
    body: JSON.stringify({ url })
  });
  return parseResponse(UnknownResponseSchema, body);
}

export function reputation(url: string) {
  return post(paths.reputation, url);
}

export function redirects(url: string) {
  return post(paths.redirects, url);
}

export function domain(url: string) {
  return post(paths.domain, url);
}

export function cryptoPatterns(url: string) {
  return post(paths.cryptoPatterns, url);
}
