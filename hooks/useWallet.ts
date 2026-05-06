import { useState } from "react";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  return { address, setAddress, connected: Boolean(address) };
}
