import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.surface, elevation: 0, shadowOpacity: 0 },
        headerTintColor: theme.colors.textPrimary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.sansMedium,
          fontSize: 11,
          marginTop: 2
        },
        tabBarIconStyle: { marginBottom: -2 }
      }}
    >
      <Tabs.Screen name="scanner" options={{ title: "Scanner", tabBarIcon: ({ color }) => <Feather name="camera" color={color} size={20} /> }} />
      <Tabs.Screen name="analyze" options={{ title: "Analyze", tabBarIcon: ({ color }) => <Feather name="search" color={color} size={20} /> }} />
      <Tabs.Screen name="airdrop" options={{ title: "Airdrop", tabBarIcon: ({ color }) => <Feather name="gift" color={color} size={20} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" color={color} size={20} /> }} />
    </Tabs>
  );
}
