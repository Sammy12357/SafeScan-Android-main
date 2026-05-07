import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TierCard } from "@/components/airdrop/TierCard";
import { TokenInfoCard } from "@/components/airdrop/TokenInfoCard";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { ReferralCard } from "@/components/shared/ReferralCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { tiers } from "@/constants/tiers";
import { theme } from "@/constants/theme";
import { fetchAirdropStatus, type AirdropStatusResponse } from "@/services/api";
import { useScanStore } from "@/stores/scanStore";

export default function AirdropScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const localScanCount = useScanStore((state) => state.history.length);
  const [airdropStatus, setAirdropStatus] = useState<AirdropStatusResponse | null>(null);
  const scanCount = airdropStatus?.scanCount ?? localScanCount;
  const referrals = airdropStatus?.referrals ?? 0;
  const currentTier = airdropStatus?.currentTier ?? (scanCount >= 50 && referrals >= 3 ? "Guardian" : scanCount >= 5 && referrals >= 1 ? "Referrer" : scanCount >= 5 ? "Scanner" : "Pending");

  useEffect(() => {
    fetchAirdropStatus().then(setAirdropStatus).catch(() => undefined);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 28, gap: 18, paddingBottom: Math.max(insets.bottom, 20) + 36 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ ...theme.typography.eyebrow }}>COMMUNITY AIRDROP</Text>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 30, fontFamily: theme.fonts.sansSemiBold }}>Register for Airdrop</Text>
        <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>
          {airdropStatus?.nextMilestone ?? "Scan QR codes, invite users, and connect a wallet to prepare for SQR token eligibility."}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} unlocked={scanCount >= tier.scanThreshold && referrals >= tier.referralThreshold} compact />
        ))}
      </View>

      <TokenInfoCard />

      <View style={{ borderWidth: 1, borderColor: "rgba(103, 242, 200, 0.2)", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.035)", padding: 18, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View>
            <Text style={{ ...theme.typography.eyebrow, fontSize: 11 }}>CURRENT TIER</Text>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 4 }}>{currentTier}</Text>
          </View>
          <View style={{ borderRadius: 999, borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.35)", backgroundColor: "rgba(16, 185, 129, 0.12)", paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" }}>
            <Text style={{ color: theme.colors.safe, fontFamily: theme.fonts.display, fontSize: 12 }}>Registered</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontFamily: theme.fonts.sansSemiBold }}>{scanCount}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Scans</Text>
          </View>
          <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontFamily: theme.fonts.sansSemiBold }}>{referrals}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>Referrals</Text>
          </View>
        </View>
      </View>

      <WalletConnect />
      <ReferralCard />
      <Card style={{ gap: 10 }}>
        <Text style={{ ...theme.typography.eyebrow, fontSize: 11 }}>step3</Text>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontFamily: theme.fonts.sansSemiBold }}>Scan QR</Text>
        <Text style={{ color: theme.colors.textSecondary, lineHeight: 22 }}>Scan QR codes to build your airdrop progress.</Text>
        <Button title="Scan QR" onPress={() => router.push("/(tabs)/scanner")} />
      </Card>
    </ScrollView>
  );
}
