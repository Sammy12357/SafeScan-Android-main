import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textPrimary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted
      }}
    >
      <Tabs.Screen name="scanner" options={{ title: "Scan", tabBarIcon: ({ color }) => <Feather name="camera" color={color} size={20} /> }} />
      <Tabs.Screen name="analyze" options={{ title: "Analyze", tabBarIcon: ({ color }) => <Feather name="search" color={color} size={20} /> }} />
      <Tabs.Screen name="airdrop" options={{ title: "Airdrop", tabBarIcon: ({ color }) => <Feather name="gift" color={color} size={20} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" color={color} size={20} /> }} />
    </Tabs>
  );
}
