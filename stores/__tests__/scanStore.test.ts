import { useScanStore } from "@/stores/scanStore";

function makeScan(id: string) {
  return { id, scanId: id, url: `https://example.com/${id}`, verdict: "safe" } as never;
}

describe("scanStore lifetimeScans", () => {
  beforeEach(() => {
    useScanStore.setState({ history: [], pending: [], currentScan: null, lifetimeScans: 0 });
  });

  it("increments on each genuinely new scan", () => {
    useScanStore.getState().addScan(makeScan("a"));
    useScanStore.getState().addScan(makeScan("b"));
    expect(useScanStore.getState().lifetimeScans).toBe(2);
  });

  it("does not double-count a re-added id", () => {
    useScanStore.getState().addScan(makeScan("a"));
    useScanStore.getState().addScan(makeScan("a"));
    expect(useScanStore.getState().lifetimeScans).toBe(1);
    expect(useScanStore.getState().history).toHaveLength(1);
  });

  it("keeps counting past the history cap", () => {
    for (let i = 0; i < 60; i += 1) {
      useScanStore.getState().addScan(makeScan(`scan-${i}`));
    }
    // history is capped at 50, but the lifetime counter is not.
    expect(useScanStore.getState().history.length).toBeLessThanOrEqual(50);
    expect(useScanStore.getState().lifetimeScans).toBe(60);
  });

  it("replaceScan does not change the lifetime count", () => {
    useScanStore.getState().addScan(makeScan("a"));
    useScanStore.getState().replaceScan("a", makeScan("a"));
    expect(useScanStore.getState().lifetimeScans).toBe(1);
  });
});
