import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, fonts, typography } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 140;
const RADIUS = 54;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score > 70) return colors.danger;
  if (score > 40) return colors.suspicious;
  return colors.safe;
}

function scoreLabel(score: number) {
  if (score > 70) return "HIGH RISK";
  if (score > 40) return "SUSPICIOUS";
  return "SAFE";
}

export function RiskGauge({ score }: { score: number }) {
  const strokeDashoffset = useSharedValue(CIRCUMFERENCE);
  const strokeColor = scoreColor(score);

  useEffect(() => {
    strokeDashoffset.value = withTiming(CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE, { duration: 1000 });
  }, [score, strokeDashoffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value
  }));

  return (
    <View accessibilityLabel={`Risk score: ${score} out of 100. Verdict: ${scoreLabel(score)}`} style={{ alignItems: "center", marginBottom: 4 }}>
      <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: "absolute" }}>
          <Circle cx={70} cy={70} r={RADIUS} stroke={colors.surfaceBorder} strokeWidth={STROKE_WIDTH} fill="none" />
          <AnimatedCircle
            cx={70}
            cy={70}
            r={RADIUS}
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </Svg>
        <Text style={{ fontSize: 32, fontFamily: fonts.sansSemiBold, color: strokeColor }}>{score}</Text>
        <Text style={{ ...typography.label, color: colors.textMuted }}>Risk Score</Text>
      </View>
      <Text style={{ ...typography.h3, color: strokeColor, marginTop: 12 }}>{scoreLabel(score)}</Text>
    </View>
  );
}
