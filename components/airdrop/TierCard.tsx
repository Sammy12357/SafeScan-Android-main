import { Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { theme } from "@/constants/theme";
import type { tiers } from "@/constants/tiers";

type Tier = (typeof tiers)[number];

export function TierCard({ tier, unlocked }: { tier: Tier; unlocked: boolean }) {
  return (
    <Card style={{ opacity: unlocked ? 1 : 0.55 }}>
      <Text style={{ color: theme.colors.accent, fontWeight: "700" }}>{tier.rank}</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "700", marginTop: 6 }}>{tier.name}</Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Scans: {tier.scanThreshold} · Referrals: {tier.referralThreshold}</Text>
      <Text style={{ color: theme.colors.safe, marginTop: 10 }}>{tier.reward}</Text>
    </Card>
  );
}
