import { render, screen } from "@testing-library/react-native";
import { RiskBadge } from "@/components/ui/RiskBadge";

describe("RiskBadge", () => {
  it("renders the tone as label when no label given", () => {
    render(<RiskBadge tone="safe" />);
    expect(screen.getByText("safe")).toBeTruthy();
  });

  it("prefers explicit label over tone", () => {
    render(<RiskBadge tone="danger" label="Block" />);
    expect(screen.getByText("Block")).toBeTruthy();
  });
});
