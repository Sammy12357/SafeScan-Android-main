import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "@/constants/theme";

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ title, variant = "primary", disabled, style, ...props }: ButtonProps) {
  const backgroundColor = variant === "primary" ? theme.colors.primary : "transparent";
  const borderColor = variant === "primary" ? theme.colors.primary : variant === "secondary" ? theme.colors.primary : theme.colors.border;
  const textColor = variant === "primary" ? theme.colors.textPrimary : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        {
          minHeight: 48,
          borderRadius: theme.radius.pill,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: state.pressed ? 0.97 : 1 }]
        },
        typeof style === "function" ? style(state) : (style as StyleProp<ViewStyle>)
      ]}
      {...props}
    >
      <Text style={{ color: textColor, fontFamily: theme.fonts.sansSemiBold, fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}
