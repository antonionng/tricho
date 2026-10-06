import { View } from "react-native";
import { router } from "expo-router";
import { PressableCard, Small, Text } from "@/components/ui";
import { timeAgo } from "@/components/messages/format";
import { colors, fonts } from "@/theme";
import type { ProfilePost } from "./types";

/** One of a member's recent posts, opening the conversation in Community. */
export function PostRow({ post }: { post: ProfilePost }) {
  const meta = [post.spaceLabel, timeAgo(post.createdAt), post.comments ? `${post.comments} ${post.comments === 1 ? "reply" : "replies"}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <PressableCard onPress={() => router.push(`/community/${post.id}`)} style={{ gap: 6 }}>
      {post.title ? <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{post.title}</Text> : null}
      <Text numberOfLines={post.title ? 2 : 4}>{post.content}</Text>
      <View>
        <Small>{meta}</Small>
      </View>
    </PressableCard>
  );
}
