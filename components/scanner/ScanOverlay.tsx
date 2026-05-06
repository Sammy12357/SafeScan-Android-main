import { useEffect } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { colors, typography } from "@/constants/theme";

const FRAME_SIZE = 260;
const CORNER_LEN = 24;
const CORNER_W = 3;

function Corner({ scanned, style }: { scanned: boolean; style: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (scanned) {
      opacity.value = withTiming(1, { duration: 200 });
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1,
      true
    );
  }, [opacity, scanned]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: CORNER_LEN,
          height: CORNER_LEN,
          borderColor: scanned ? colors.safe : colors.primary
        },
        style,
        animatedStyle
      ]}
    />
  );
}

export function ScanOverlay({ detected }: { detected: boolean }) {
  const { width, height } = useWindowDimensions();
  const top = (height - FRAME_SIZE) / 2;
  const left = (width - FRAME_SIZE) / 2;

  return (
    <View pointerEvents="none" style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: top, backgroundColor: "rgba(10,10,15,0.75)" }} />
      <View style={{ position: "absolute", left: 0, top, width: left, height: FRAME_SIZE, backgroundColor: "rgba(10,10,15,0.75)" }} />
      <View style={{ position: "absolute", right: 0, top, width: left, height: FRAME_SIZE, backgroundColor: "rgba(10,10,15,0.75)" }} />
      <View style={{ position: "absolute", left: 0, right: 0, top: top + FRAME_SIZE, bottom: 0, backgroundColor: "rgba(10,10,15,0.75)" }} />

      <Corner scanned={detected} style={{ top, left, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W }} />
      <Corner scanned={detected} style={{ top, left: left + FRAME_SIZE - CORNER_LEN, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W }} />
      <Corner scanned={detected} style={{ top: top + FRAME_SIZE - CORNER_LEN, left, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W }} />
      <Corner scanned={detected} style={{ top: top + FRAME_SIZE - CORNER_LEN, left: left + FRAME_SIZE - CORNER_LEN, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W }} />

      {!detected ? (
        <Text style={{ ...typography.body, position: "absolute", top: top + FRAME_SIZE + 24, alignSelf: "center", color: colors.textSecondary }}>
          Align QR code within the frame
        </Text>
      ) : null}
    </View>
  );
}
