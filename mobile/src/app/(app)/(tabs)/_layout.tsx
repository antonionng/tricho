import { Tabs } from "expo-router";
import { CalendarDays, Home, MessagesSquare, UserRound, Users } from "lucide-react-native";
import { HeaderActions } from "@/components/HeaderActions";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.6, color: colors.ink },
        headerTitleAlign: "left",
        headerRight: () => <HeaderActions />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.rule },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.paper },
      }}>
      <Tabs.Screen name="index" options={{ title: "Home", headerTitle: "Trichollective", tabBarIcon: ({ color }) => <Home color={color} size={22} strokeWidth={1.75} /> }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color }) => <MessagesSquare color={color} size={22} strokeWidth={1.75} /> }} />
      <Tabs.Screen name="people" options={{ title: "People", tabBarIcon: ({ color }) => <Users color={color} size={22} strokeWidth={1.75} /> }} />
      <Tabs.Screen name="events" options={{ title: "Events", tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} strokeWidth={1.75} /> }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: ({ color }) => <UserRound color={color} size={22} strokeWidth={1.75} /> }} />
    </Tabs>
  );
}
