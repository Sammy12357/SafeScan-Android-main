import { useState } from "react";
import { LayoutAnimation, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/risk/SeverityBadge";
import type { Signal } from "@/services/api";
import { theme } from "@/constants/theme";

export function SignalAccordion({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((value) => !value);
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{signal.check}</Text>
            <Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>{signal.result}</Text>
          </View>
          <SeverityBadge severity={signal.severity} />
        </View>
        {expanded ? <Text style={{ color: theme.colors.textSecondary, lineHeight: 22, marginTop: 12 }}>{signal.description}</Text> : null}
      </Pressable>
    </Card>
  );
}
