import { Pressable, Text, type PressableProps } from "react-native";
import { theme } from "@/constants/theme";

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ title, variant = "primary", disabled, style, ...props }: ButtonProps) {
  const backgroundColor = variant === "primary" ? theme.colors.primary : variant === "secondary" ? theme.colors.surfaceElevated : "transparent";
  const borderColor = variant === "ghost" ? theme.colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        {
          minHeight: 48,
          borderRadius: theme.radius.card,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 18,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          opacity: disabled ? 0.5 : 1
        },
        style
      ]}
      {...props}
    >
      <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}
