import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { analyzeUrl } from "@/services/api";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useScanStore } from "@/stores/scanStore";
import { useAirdropStore } from "@/stores/airdropStore";
import { useAuthStore } from "@/stores/authStore";

export function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();
  const pending = useScanStore((state) => state.pending);
  const replaceScan = useScanStore((state) => state.replaceScan);
  const removePending = useScanStore((state) => state.removePending);
  const fetchAirdropStatus = useAirdropStore((state) => state.fetchStatus);
  const hasBackendSession = useAuthStore((state) => state.hasBackendSession);
  const queryClient = useQueryClient();
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isOnline || pending.length === 0) return;
    let cancelled = false;

    const flush = async () => {
      let anyReplayed = false;
      for (const entry of pending) {
        if (cancelled) return;
        if (inFlight.current.has(entry.id)) continue;
        inFlight.current.add(entry.id);
        try {
          const result = await analyzeUrl(entry.payload);
          if (cancelled) return;
          const scanId = result.scanId || entry.id;
          const replacement = { ...result, scanId, id: entry.id, pending: false };
          replaceScan(entry.id, replacement);
          queryClient.setQueryData(["scan-result", entry.id], replacement);
          if (result.scanId && result.scanId !== entry.id) {
            queryClient.setQueryData(["scan-result", result.scanId], replacement);
          }
          removePending(entry.id);
          anyReplayed = true;
        } catch {
          // leave in queue; next online tick will retry
        } finally {
          inFlight.current.delete(entry.id);
        }
      }
      // After a successful replay batch, refresh airdrop so the tier
      // reflects the now-counted scans.
      if (anyReplayed && hasBackendSession && !cancelled) {
        void fetchAirdropStatus().catch(() => undefined);
      }
    };

    void flush();
    return () => {
      cancelled = true;
    };
  }, [fetchAirdropStatus, hasBackendSession, isOnline, pending, queryClient, removePending, replaceScan]);
}
