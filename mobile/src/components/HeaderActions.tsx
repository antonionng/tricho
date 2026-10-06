import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Bell, MessageCircle } from "lucide-react-native";
import { CountDot } from "@/components/ui";
import { useMe } from "@/lib/me";
import { colors } from "@/theme";

/** Messages and notifications, top right on every tab, as on the website. */
export function HeaderActions() {
  const { data } = useMe();
  return (
    <View style={{ flexDirection: "row", gap: 18, paddingRight: 4 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Messages" hitSlop={10} onPress={() => router.push("/messages")}>
        <MessageCircle size={22} color={colors.ink} strokeWidth={1.75} />
        <CountDot count={data?.counts.messages ?? 0} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={10} onPress={() => router.push("/notifications")}>
        <Bell size={22} color={colors.ink} strokeWidth={1.75} />
        <CountDot count={data?.counts.notifications ?? 0} />
      </Pressable>
    </View>
  );
}
