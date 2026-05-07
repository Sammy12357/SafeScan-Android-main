import { useCallback, useEffect } from "react";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import { RefreshControl, Text, View, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { api, type AnalyzeResult, type ScanHistoryItem } from "@/services/api";
import { truncateMiddle } from "@/utils/url";

const verdictStyles: Record<string, { badge: string; text: string; label: string }> = {
  safe: { badge: "border-risk-safe-border bg-risk-safe-bg", text: "text-risk-safe-text", label: "SAFE" },
  warn: { badge: "border-risk-warn-border bg-risk-warn-bg", text: "text-risk-warn-text", label: "WARN" },
  danger: { badge: "border-risk-danger-border bg-risk-danger-bg", text: "text-risk-danger-text", label: "DANGER" }
};

function historyItemToAnalyzeResult(item: ScanHistoryItem): AnalyzeResult {
  const verdict = item.verdict === "safe" || item.verdict === "warn" || item.verdict === "danger"
    ? item.verdict
    : item.riskScore >= 80
      ? "danger"
      : item.riskScore >= 40
        ? "warn"
        : "safe";

  return {
    scanId: item.scanId,
    url: item.url,
    riskScore: item.riskScore,
    verdict,
    verdictText: verdictStyles[verdict].label,
    signals: item.signals,
    analyzedAt: item.analyzedAt,
    overallRisk: verdict === "danger" ? "high" : verdict === "warn" ? "suspicious" : "safe",
    confidenceScore: item.riskScore,
    scannedAt: item.scannedAt,
    counted: undefined,
    scanCount: undefined,
    payloadType: undefined,
    source: "backend"
  };
}

function SkeletonRow() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.35, { duration: 700 })), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style} className="rounded-web border border-border bg-surface p-4">
      <View className="h-4 w-3/4 rounded-pill bg-border" />
      <View className="mt-4 flex-row items-center justify-between">
        <View className="h-7 w-20 rounded-pill bg-border" />
        <View className="h-4 w-24 rounded-pill bg-border" />
      </View>
    </Animated.View>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = verdictStyles[verdict] ?? verdictStyles.warn;

  return (
    <View className={`rounded-pill border px-3 py-1 ${styles.badge}`}>
      <Text className={`font-semibold text-xs ${styles.text}`}>{styles.label}</Text>
    </View>
  );
}

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const historyQuery = useQuery({
    queryKey: ["scan", "history"],
    queryFn: () => api.scan.history()
  });

  useFocusEffect(
    useCallback(() => {
      void historyQuery.refetch();
    }, [historyQuery.refetch])
  );

  const openResult = (item: ScanHistoryItem) => {
    const result = historyItemToAnalyzeResult(item);
    queryClient.setQueryData(["scan-result", result.scanId], result);
    router.push({ pathname: "/scan-result/[id]", params: { id: result.scanId } });
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    const result = historyItemToAnalyzeResult(item);
    const relativeTime = formatDistanceToNow(new Date(result.analyzedAt), { addSuffix: true });

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => openResult(item)}
        className="mb-3 rounded-web border border-border bg-surface p-4"
      >
        <Text className="font-mono text-sm text-textPrimary" numberOfLines={1}>
          {truncateMiddle(result.url, 54)}
        </Text>
        <View className="mt-4 flex-row items-center justify-between gap-3">
          <VerdictBadge verdict={result.verdict} />
          <Text className="font-semibold text-base text-textPrimary">{result.riskScore}/100</Text>
          <Text className="flex-1 text-right font-ui text-sm text-textSecondary" numberOfLines={1}>
            {relativeTime}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top + 28 }}>
      <View className="px-4 pb-5">
        <Text className="font-semibold text-xs uppercase tracking-widest text-accent">SafeScan QR</Text>
        <Text className="mt-2 font-semibold text-3xl text-textPrimary">Scan History</Text>
      </View>

      {historyQuery.isPending ? (
        <View className="gap-3 px-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlashList
          data={historyQuery.data ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.scanId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 20) + 28 }}
          refreshControl={<RefreshControl refreshing={historyQuery.isFetching && !historyQuery.isPending} onRefresh={() => historyQuery.refetch()} tintColor={theme.colors.accent} />}
          ListEmptyComponent={
            <View style={{ minHeight: 420 }} className="items-center justify-center px-6">
              <Text className="text-center font-semibold text-xl text-textPrimary">No scans yet.</Text>
              <Text className="mt-2 text-center font-ui text-base text-textSecondary">Scan your first QR code.</Text>
            </View>
          }
        />
      )}

      {historyQuery.error ? (
        <Text className="px-4 pt-4 text-center font-ui text-danger">
          {historyQuery.error instanceof Error ? historyQuery.error.message : "Could not load scan history."}
        </Text>
      ) : null}
    </View>
  );
}
