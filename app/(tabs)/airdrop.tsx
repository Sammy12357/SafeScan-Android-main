import { ScrollView, Text } from "react-native";
import { TierCard } from "@/components/airdrop/TierCard";
import { TokenInfoCard } from "@/components/airdrop/TokenInfoCard";
import { tiers } from "@/constants/tiers";
import { theme } from "@/constants/theme";

export default function AirdropScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" }}>SafeScan Airdrop</Text>
      <TokenInfoCard />
      {tiers.map((tier) => (
        <TierCard key={tier.id} tier={tier} unlocked={false} />
      ))}
    </ScrollView>
  );
}
