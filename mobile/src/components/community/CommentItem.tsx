import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { CornerDownRight } from "lucide-react-native";
import { Avatar, Small, Text } from "@/components/ui";
import { colors, fonts, space } from "@/theme";
import { timeAgo } from "./format";
import { ReportButton } from "./ReportButton";
import type { ThreadComment } from "./types";
import { UsefulButton } from "./UsefulButton";

/** One reply in a thread, with Useful, Reply and Report beneath it. */
export function CommentItem({ comment: c, onReply }: { comment: ThreadComment; onReply?: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <Pressable onPress={() => router.push(`/people/${c.author.id}`)} accessibilityLabel={c.author.name ?? "Member"}>
        <Avatar name={c.author.name} image={c.author.image} size={32} />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 14 }}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>{c.author.name || "Member"}</Text>
          <Small> · {timeAgo(c.createdAt)}</Small>
        </Text>
        <Text selectable>{c.content}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 4, marginLeft: -2 }}>
          <UsefulButton commentId={c.id} count={c.useful} reacted={c.reacted} size="xs" />
          {onReply && (
            <Pressable accessibilityRole="button" onPress={onReply} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 8 }}>
              <CornerDownRight size={15} color={colors.ink2} strokeWidth={1.75} />
              <Text style={{ fontSize: 13, color: colors.ink2 }}>Reply</Text>
            </Pressable>
          )}
          {!c.mine && <ReportButton commentId={c.id} />}
        </View>
      </View>
    </View>
  );
}
