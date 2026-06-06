import { useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { fetchLeaderboard } from "@/services/api";
import { useScanStore } from "@/stores/scanStore";
import { truncateMiddle } from "@/utils/url";

type LeaderboardEntry = {
  rank: number;
  name: string;
  scans: number;
  tier?: string;
  isCurrentUser?: boolean;
};

async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  const data = await fetchLeaderboard(50);
  return data.entries.map((entry) => ({
    rank: entry.rank,
    name: entry.name,
    scans: entry.scans,
    isCurrentUser: entry.isCurrentUser
  }));
}

function LeaderRow({ item }: { item: LeaderboardEntry }) {
  const rankColor = item.rank <= 3 ? theme.colors.accent : theme.colors.textSecondary;

  return (
    <View
      className="flex-row items-center gap-3 border-b border-border px-1 py-4"
      style={{ backgroundColor: item.isCurrentUser ? theme.colors.primaryDim : "transparent" }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-web border border-border bg-surfaceElevated">
        <Text className="font-display text-sm" style={{ color: rankColor }}>
          {item.rank}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-display text-base text-textPrimary" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-1 font-ui text-xs text-textSecondary">{item.tier ?? "SafeScan member"}</Text>
      </View>
      <View className="items-end">
        <Text className="font-display text-lg text-textPrimary">{item.scans}</Text>
        <Text className="font-ui text-xs text-textSecondary">scans</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const localHistory = useScanStore((state) => state.history);
  const lifetimeScans = useScanStore((state) => state.lifetimeScans);
  const leaderboardQuery = useQuery({
    queryKey: ["global-leaderboard"],
    queryFn: loadLeaderboard,
    // Live board: refetch on focus + every 30s while the tab is open so it
    // keeps up with scans happening across all users.
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true
  });

  // Local fallback only when the live board is genuinely empty (e.g. first
  // launch before the backend has recorded anything, or offline). lifetimeScans
  // persists and isn't capped by HISTORY_LIMIT, matching the Profile tab.
  const localScanCount = Math.max(lifetimeScans, localHistory.length);
  const localFallback = useMemo<LeaderboardEntry[]>(
    () =>
      localScanCount
        ? [
            {
              rank: 1,
              name: "This device",
              scans: localScanCount,
              tier: `Latest: ${truncateMiddle(localHistory[0]?.url ?? "Scan", 28)}`,
              isCurrentUser: true
            }
          ]
        : [],
    [localScanCount, localHistory]
  );
  const entries = leaderboardQuery.data?.length ? leaderboardQuery.data : localFallback;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 20) + 36 }}
      data={entries}
      keyExtractor={(item) => `${item.rank}-${item.name}`}
      renderItem={({ item }) => <LeaderRow item={item} />}
      refreshControl={<RefreshControl tintColor="#ffffff" colors={["#ffffff"]} progressBackgroundColor={theme.colors.surfaceElevated} refreshing={leaderboardQuery.isRefetching} onRefresh={() => leaderboardQuery.refetch()} />}
      ListHeaderComponent={
        <View className="mb-5 gap-3">
          <Text className="font-display text-xs uppercase tracking-widest text-accent">SafeScan QR</Text>
          <Text className="font-display text-3xl text-textPrimary">Global Leaderboard</Text>
          <Text className="font-ui text-sm leading-6 text-textSecondary">
            Live ranking of every SafeScan user by total QR scans. Updates automatically; pull down to refresh now.
          </Text>
          {leaderboardQuery.isLoading ? <ActivityIndicator color={theme.colors.accent} /> : null}
          {leaderboardQuery.error ? (
            <Text className="rounded-web border border-risk-warn-border bg-risk-warn-bg p-3 font-ui text-risk-warn-text">
              {leaderboardQuery.error instanceof Error ? leaderboardQuery.error.message : "Could not load leaderboard."}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View className="rounded-web border border-border bg-surface p-5">
          <Text className="font-display text-lg text-textPrimary">No scans yet.</Text>
          <Text className="mt-2 font-ui text-sm leading-6 text-textSecondary">
            The website leaderboard is empty right now. Start scanning and check back after the backend records activity.
          </Text>
        </View>
      }
    />
  );
}
