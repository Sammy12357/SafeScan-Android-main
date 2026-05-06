import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, typography } from "@/constants/theme";
import type { tiers } from "@/constants/tiers";

type Tier = (typeof tiers)[number];

export function TierCard({ tier, unlocked }: { tier: Tier; unlocked: boolean }) {
  return (
    <Card
      style={{
        opacity: unlocked ? 1 : 0.5,
        minHeight: 170,
        borderColor: unlocked ? colors.primary : colors.surfaceBorder,
        backgroundColor: unlocked ? colors.primaryDim : colors.surface,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {!unlocked ? (
        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
          <Feather name="lock" size={54} color={colors.textPrimary} />
        </View>
      ) : null}
      <Text style={{ ...typography.label, color: colors.primaryLight, letterSpacing: 1.2 }}>{tier.rank.toUpperCase()}</Text>
      <Text style={{ ...typography.h3, fontSize: 22, marginTop: 8 }}>{tier.name}</Text>
      <Text style={{ ...typography.body, marginTop: 8 }}>Scan {tier.scanThreshold} QR codes and invite {tier.referralThreshold} user{tier.referralThreshold === 1 ? "" : "s"}.</Text>
      <View style={{ alignSelf: "flex-start", marginTop: "auto", borderRadius: 999, backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ ...typography.badge, color: colors.primaryLight }}>{tier.reward.toUpperCase()}</Text>
      </View>
    </Card>
  );
}
