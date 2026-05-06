import { Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { theme } from "@/constants/theme";

export function ReferralCard() {
  return (
    <Card>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "700" }}>Referral link</Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Invite users and unlock SQR tier bonuses.</Text>
    </Card>
  );
}
