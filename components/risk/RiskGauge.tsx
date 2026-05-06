import Svg, { Circle } from "react-native-svg";
import { Text, View } from "react-native";
import { riskToColor, riskToLabel, scoreToRisk } from "@/utils/risk";
import { theme } from "@/constants/theme";

export function RiskGauge({ score }: { score: number }) {
  const risk = scoreToRisk(score);
  const color = riskToColor(risk);
  const size = 112;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <View accessibilityLabel={`Risk score: ${score} out of 100. Verdict: ${riskToLabel(risk)}`} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" }}>{score}</Text>
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{riskToLabel(risk)}</Text>
    </View>
  );
}
