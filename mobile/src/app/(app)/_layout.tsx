import { useEffect } from "react";
import { Stack } from "expo-router";
import { useMe } from "@/lib/me";
import { usePushNotifications } from "@/lib/push";
import { setUpPurchases } from "@/lib/purchases";
import { colors, fonts } from "@/theme";

/**
 * The member area: the tabs, with every other screen pushed on top. Routes
 * mirror the website, so /members/community/abc is /community/abc here.
 */
export default function AppLayout() {
  const me = useMe();
  const userId = me.data?.user?.id;
  usePushNotifications(!!userId);

  useEffect(() => {
    if (userId) setUpPurchases(userId).catch(() => {});
  }, [userId]);

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.sansSemibold, fontSize: 16 },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.paper },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="membership" options={{ presentation: "modal", title: "Membership" }} />
    </Stack>
  );
}
