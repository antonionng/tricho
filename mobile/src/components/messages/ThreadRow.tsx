import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Avatar, Small, Text } from "@/components/ui";
import { colors, fonts, gutter } from "@/theme";
import { threadTitle, timeAgo } from "./format";
import type { Thread } from "./types";

/** One conversation in the inbox: who it's with, the last message and an unread dot. */
export function ThreadRow({ thread }: { thread: Thread }) {
  const title = threadTitle(thread.others);
  const preview = thread.last ? `${thread.last.mine ? "You: " : ""}${thread.last.body}` : "No messages yet";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${thread.unread ? ", unread" : ""}. ${preview}`}
      onPress={() => router.push(`/messages/${thread.id}`)}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gutter, paddingVertical: 14 },
        pressed && { backgroundColor: colors.paper2 },
      ]}>
      <Avatar name={thread.others[0]?.name} image={thread.others[0]?.image} size={44} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
          <Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontFamily: thread.unread ? fonts.sansSemibold : fonts.sansMedium }}>
            {title}
          </Text>
          <Small>{timeAgo(thread.at)}</Small>
        </View>
        <Small numberOfLines={1} style={{ fontSize: 14, color: thread.unread ? colors.ink : colors.muted }}>
          {preview}
        </Small>
      </View>
      {thread.unread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink }} />}
    </Pressable>
  );
}
