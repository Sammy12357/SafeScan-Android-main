import { TextInput, type TextInputProps } from "react-native";
import { theme } from "@/constants/theme";

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.muted}
      style={{
        minHeight: 48,
        borderRadius: theme.radius.card,
        borderColor: theme.colors.border,
        borderWidth: 1,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14
      }}
      {...props}
    />
  );
}
