import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { MessageCircle, Pin } from "lucide-react-native";
import { Avatar, PressableCard, Small, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import { professionLabel, timeAgo } from "./format";
import type { FeedPost } from "./types";
import { UsefulButton } from "./UsefulButton";

/** A post in a feed: who wrote it, where, a preview, and Useful and reply counts. */
export function PostCard({ post, showSpace = true }: { post: FeedPost; showSpace?: boolean }) {
  const meta = [professionLabel(post.author.profession), showSpace && post.spaceLabel, post.chapter?.city, timeAgo(post.createdAt)]
    .filter(Boolean)
    .join(" · ");
  const open = () => router.push(`/community/${post.id}`);

  return (
    <PressableCard onPress={open} accessibilityLabel={post.title || `Post by ${post.author.name || "a member"}`} style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
        <Pressable onPress={() => router.push(`/people/${post.author.id}`)} accessibilityLabel={post.author.name ?? "Member"}>
          <Avatar name={post.author.name} image={post.author.image} size={40} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>
            {post.author.name || "Member"}
            {post.author.isFounding ? <Small> · Founding member</Small> : null}
          </Text>
          <Small numberOfLines={1}>{meta}</Small>
        </View>
        {post.pinned && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.paper2, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Pin size={12} color={colors.ink2} strokeWidth={1.75} />
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink2 }}>Pinned</Text>
          </View>
        )}
      </View>

      <View style={{ gap: 6 }}>
        {post.title ? <Text variant="heading">{post.title}</Text> : null}
        <Text numberOfLines={4}>{post.content}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <UsefulButton postId={post.id} count={post.useful} reacted={post.reacted} />
        <Pressable onPress={open} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 10 }}>
          <MessageCircle size={16} color={colors.ink2} strokeWidth={1.75} />
          <Text style={{ fontSize: 13, color: colors.ink2 }}>
            {post.comments === 0 ? "Reply" : `${post.comments} ${post.comments === 1 ? "reply" : "replies"}`}
          </Text>
        </Pressable>
      </View>
    </PressableCard>
  );
}
