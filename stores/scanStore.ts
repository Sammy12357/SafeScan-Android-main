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
  // Monotonic lifetime scan counter. `history` is capped at HISTORY_LIMIT and
  // dedupes, so its length undercounts once you pass the cap or re-scan the
  // same URL. lifetimeScans is the source of truth for "how many scans has
  // this device done" and is persisted so it survives app restarts.
  lifetimeScans: number;
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
      lifetimeScans: 0,
      setCurrentScan: (scan) => set({ currentScan: scan }),
      addScan: (scan) =>
        set((state) => {
          // Only count a genuinely new scan toward the lifetime total. Re-adds
          // of an id already in history (e.g. a duplicate navigation) don't
          // double-count; offline replays go through replaceScan, not addScan.
          const isNew = !state.history.some((item) => item.id === scan.id);
          return {
            currentScan: scan,
            history: [scan, ...state.history.filter((item) => item.id !== scan.id)].slice(0, HISTORY_LIMIT),
            lifetimeScans: state.lifetimeScans + (isNew ? 1 : 0)
          };
        }),
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
      partialize: (state) => ({ history: state.history, pending: state.pending, lifetimeScans: state.lifetimeScans }),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as Partial<ScanStore>;
        // v1 had no lifetimeScans; seed it from the persisted history length
        // so existing users don't suddenly show 0 after this upgrade.
        if (version < 2 && (state.lifetimeScans === undefined || state.lifetimeScans === null)) {
          state.lifetimeScans = Array.isArray(state.history) ? state.history.length : 0;
        }
        return state as ScanStore;
      }
    }
  )
);
