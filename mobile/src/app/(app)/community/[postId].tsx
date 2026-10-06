import { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Avatar, Button, Card, ErrorState, Label, Loading, Rule, Small, Text, Title } from "@/components/ui";
import { CommentItem } from "@/components/community/CommentItem";
import { Notice } from "@/components/community/ComposePrompt";
import { ReportButton } from "@/components/community/ReportButton";
import { UsefulButton } from "@/components/community/UsefulButton";
import { professionLabel, timeAgo } from "@/components/community/format";
import { communityKeys, refreshFeeds } from "@/components/community/queries";
import type { ThreadResponse } from "@/components/community/types";
import { api } from "@/lib/api";
import { colors, fonts, gutter, radius, space } from "@/theme";

const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] || "this member";

export default function ThreadScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const thread = useQuery({ queryKey: communityKeys.post(postId), queryFn: () => api<ThreadResponse>(`community/${postId}`) });

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);

  if (thread.isPending) return <Loading />;
  if (thread.isError) return <ErrorState error={thread.error} onRetry={() => thread.refetch()} />;
  const { post, room, canReply, replyNotice } = thread.data;

  const startReply = (id: string, name: string | null) => {
    setReplyTo({ id, name: firstName(name) });
    input.current?.focus();
  };

  const send = async () => {
    if (text.trim().length < 2) return;
    setSending(true);
    try {
      await api(`community/${postId}/comments`, { body: { content: text, parentId: replyTo?.id } });
      setText("");
      setReplyTo(null);
      input.current?.blur();
      await thread.refetch();
      refreshFeeds(qc);
      if (!replyTo) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const meta = [professionLabel(post.author.profession), post.chapter?.city, timeAgo(post.createdAt)].filter(Boolean).join(" · ");

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
      <Stack.Screen options={{ title: room?.label ?? "Community" }} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: gutter, paddingBottom: space.xxl, gap: space.lg }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <Card style={{ gap: space.lg }}>
          <Pressable onPress={() => router.push(`/people/${post.author.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Avatar name={post.author.name} image={post.author.image} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{post.author.name || "Member"}</Text>
              <Small>{meta}</Small>
            </View>
          </Pressable>
          {post.title ? <Title>{post.title}</Title> : null}
          <Text selectable style={{ fontSize: 16, lineHeight: 26 }}>
            {post.content}
          </Text>
          <Rule />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <UsefulButton postId={post.id} count={post.useful} reacted={post.reacted} size="lg" />
            {!post.mine && <ReportButton postId={post.id} />}
          </View>
        </Card>

        <Label>{post.comments === 0 ? "No replies yet" : `${post.comments} ${post.comments === 1 ? "reply" : "replies"}`}</Label>
        {thread.data.thread.map((c) => (
          <Card key={c.id} style={{ gap: space.md, padding: space.lg }}>
            <CommentItem comment={c} onReply={canReply ? () => startReply(c.id, c.author.name) : undefined} />
            {c.replies.length > 0 && (
              <View style={{ marginLeft: 44, paddingLeft: space.md, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.rule, gap: space.md }}>
                {c.replies.map((r) => (
                  <CommentItem key={r.id} comment={r} onReply={canReply ? () => startReply(c.id, r.author.name) : undefined} />
                ))}
              </View>
            )}
          </Card>
        ))}

        {!canReply && replyNotice && <Notice>{replyNotice}</Notice>}
      </ScrollView>

      {canReply && (
        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule, backgroundColor: colors.card, paddingHorizontal: gutter, paddingTop: space.md, paddingBottom: Math.max(insets.bottom, space.md), gap: space.sm }}>
          {replyTo && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Small>Replying to {replyTo.name}</Small>
              <Pressable accessibilityRole="button" accessibilityLabel="Stop replying to this comment" hitSlop={10} onPress={() => setReplyTo(null)}>
                <X size={16} color={colors.muted} strokeWidth={1.75} />
              </Pressable>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm }}>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={3000}
              placeholder="Add something useful: an experience, a question or a reference."
              placeholderTextColor={colors.mute}
              accessibilityLabel={replyTo ? `Reply to ${replyTo.name}` : "Your reply"}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 140,
                borderWidth: 1,
                borderColor: colors.input,
                borderRadius: radius.md,
                backgroundColor: colors.paper,
                paddingHorizontal: 12,
                paddingTop: 11,
                paddingBottom: 11,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: colors.ink,
              }}
            />
            <Button title="Reply" size="sm" onPress={send} loading={sending} disabled={text.trim().length < 2} style={{ minHeight: 44 }} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
