import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders title text", () => {
    render(<Button title="Scan now" onPress={() => undefined} />);
    expect(screen.getByText("Scan now")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button title="Tap me" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button title="Locked" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
