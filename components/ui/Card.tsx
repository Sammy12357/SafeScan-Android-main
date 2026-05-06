import { View, type ViewProps } from "react-native";
import { theme } from "@/constants/theme";

export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.card,
          padding: theme.spacing.card,
          ...theme.shadows.cardSubtle
        },
        style
      ]}
      {...props}
    />
  );
}
