import { Text, View } from "react-native";
import { useScanStore } from "@/stores/scanStore";
import { theme } from "@/constants/theme";

export function ScanHistory() {
  const history = useScanStore((state) => state.history);
  const recent = history.slice(0, 5);

  if (recent.length === 0) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel="No scans yet"
        style={{ paddingVertical: 6 }}
      >
        <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.sans, fontSize: 13, lineHeight: 18 }}>
          Nothing scanned yet. Point the camera at a QR code to see your history here.
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${recent.length} recent scans`}
      style={{ gap: 8 }}
    >
      {recent.map((scan) => (
        <View
          key={scan.id}
          accessible
          accessibilityLabel={scan.pending ? `${scan.url}, queued for re-check when back online` : scan.url}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <Text numberOfLines={1} style={{ flex: 1, color: theme.colors.textSecondary }}>{scan.url}</Text>
          {scan.pending ? (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: theme.colors.primaryDim, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.accent, fontSize: 10, fontFamily: theme.fonts.display, letterSpacing: 0.6 }}>OFFLINE</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
