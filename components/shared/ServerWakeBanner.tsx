import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { config } from "@/constants/config";
import { theme } from "@/constants/theme";

export function ServerWakeBanner({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), config.serverWakeDelayMs);
    return () => clearTimeout(id);
  }, [active]);

  if (!visible) return null;
  return (
    <View style={{ backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: theme.colors.textPrimary }}>Waking up the server... this may take 30 seconds.</Text>
    </View>
  );
}
