import React, { type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";
import { log } from "@/services/logger";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
};

const SUPPORT_EMAIL = "support@safescan.app";

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
    componentStack: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { error, componentStack: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack ?? null });
    log.error(error, { componentStack: errorInfo.componentStack });
  }

  reset = () => {
    this.setState({ error: null, componentStack: null });
  };

  copyDetails = async () => {
    const { error, componentStack } = this.state;
    if (!error) return;
    const payload = [`Message: ${error.message}`, error.stack ?? "", componentStack ?? ""].filter(Boolean).join("\n\n");
    await Clipboard.setStringAsync(payload);
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          backgroundColor: theme.colors.background
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.textPrimary,
            fontSize: 24,
            textAlign: "center",
            fontFamily: theme.fonts.sansSemiBold
          }}
        >
          Something went wrong
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            textAlign: "center",
            fontFamily: theme.fonts.sans,
            lineHeight: 22
          }}
        >
          SafeScan ran into an unexpected error. Try again — if it keeps happening, please email{" "}
          <Text style={{ color: theme.colors.accent }}>{SUPPORT_EMAIL}</Text>.
        </Text>
        {__DEV__ ? (
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              textAlign: "center",
              fontFamily: theme.fonts.mono,
              fontSize: 12,
              paddingHorizontal: 16
            }}
          >
            {this.state.error.message}
          </Text>
        ) : null}
        <Button
          title="Try again"
          onPress={this.reset}
          accessibilityHint="Resets the current screen and tries to recover from the error"
        />
        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy error details to clipboard"
            onPress={this.copyDetails}
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: theme.colors.accent, fontFamily: theme.fonts.sans }}>Copy error details</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
}
