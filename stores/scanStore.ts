import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnalyzeResponse } from "@/services/api";
import { fileSystemStorage } from "@/services/storage";

export type ScanRecord = AnalyzeResponse & {
  id: string;
  pending?: boolean;
};

export type PendingScan = {
  id: string;
  payload: string;
  queuedAt: number;
};

type ScanStore = {
  currentScan: ScanRecord | null;
  history: ScanRecord[];
  pending: PendingScan[];
  setCurrentScan: (scan: ScanRecord) => void;
  addScan: (scan: ScanRecord) => void;
  replaceScan: (id: string, scan: ScanRecord) => void;
  enqueuePending: (entry: PendingScan) => void;
  removePending: (id: string) => void;
  clearHistory: () => void;
};

const HISTORY_LIMIT = 50;

export const useScanStore = create<ScanStore>()(
  persist(
    (set) => ({
      currentScan: null,
      history: [],
      pending: [],
      setCurrentScan: (scan) => set({ currentScan: scan }),
      addScan: (scan) =>
        set((state) => ({
          currentScan: scan,
          history: [scan, ...state.history.filter((item) => item.id !== scan.id)].slice(0, HISTORY_LIMIT)
        })),
      replaceScan: (id, scan) =>
        set((state) => ({
          currentScan: state.currentScan?.id === id ? scan : state.currentScan,
          history: state.history.map((item) => (item.id === id ? scan : item))
        })),
      enqueuePending: (entry) =>
        set((state) => ({
          pending: [...state.pending.filter((item) => item.id !== entry.id), entry]
        })),
      removePending: (id) =>
        set((state) => ({
          pending: state.pending.filter((item) => item.id !== id)
        })),
      clearHistory: () => set({ currentScan: null, history: [], pending: [] })
    }),
    {
      name: "scan-store",
      storage: createJSONStorage(() => fileSystemStorage),
      partialize: (state) => ({ history: state.history, pending: state.pending }),
      version: 1
    }
  )
);
