import { useEffect, useState } from "react";
import { Text } from "react-native";
import { theme } from "@/constants/theme";

const steps = ["Tracing redirects...", "Checking domain age...", "Running reputation scan...", "Consulting AI analyst..."];

export function LoadingSteps({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setIndex((value) => (value + 1) % steps.length), 1400);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  return <Text style={{ color: theme.colors.accent }}>{steps[index]}</Text>;
}
