import { render, screen } from "@testing-library/react-native";
import { ScanHistory } from "@/components/scanner/ScanHistory";
import { useScanStore } from "@/stores/scanStore";

describe("ScanHistory", () => {
  beforeEach(() => {
    useScanStore.setState({ history: [], pending: [], currentScan: null });
  });

  it("renders the most recent scan URLs", () => {
    useScanStore.setState({
      history: [
        { id: "1", url: "https://safescan.example/a", verdict: "safe" } as never,
        { id: "2", url: "https://danger.test/b", verdict: "danger" } as never
      ]
    });
    render(<ScanHistory />);
    expect(screen.getByText("https://safescan.example/a")).toBeTruthy();
    expect(screen.getByText("https://danger.test/b")).toBeTruthy();
  });

  it("shows OFFLINE pill for pending entries", () => {
    useScanStore.setState({
      history: [
        { id: "1", url: "https://offline.example", verdict: "warn", pending: true } as never
      ]
    });
    render(<ScanHistory />);
    expect(screen.getByText("OFFLINE")).toBeTruthy();
  });

  it("renders empty-state copy when history is empty", () => {
    render(<ScanHistory />);
    expect(screen.getByText(/nothing scanned yet/i)).toBeTruthy();
  });
});
