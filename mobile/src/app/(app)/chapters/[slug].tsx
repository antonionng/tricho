import { Pressable, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Card, Display, Empty, ErrorState, Label, Loading, Muted, Screen, Section, Small, Text } from "@/components/ui";
import { mutedNotice } from "@/components/community/format";
import { ComposePrompt } from "@/components/community/ComposePrompt";
import { EventRow, PersonRow } from "@/components/community/Mini";
import { PostCard } from "@/components/community/PostCard";
import type { ChapterResponse } from "@/components/community/types";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { colors, space } from "@/theme";

/** A local chapter: what members nearby are sharing, upcoming meetups and who belongs to it. */
export default function ChapterScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: me } = useMe();
  const q = useQuery({ queryKey: ["chapters", slug], queryFn: () => api<ChapterResponse>(`chapters/${slug}`) });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const { chapter, isMine, blurb, posts, members, memberCount, events } = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: chapter.city }} />
      <View style={{ gap: space.sm }}>
        <Label>{isMine ? "Your chapter" : `Chapter · ${chapter.country}`}</Label>
        <Display>{chapter.city}</Display>
        {blurb ? <Muted>{blurb}</Muted> : null}
        {!isMine && (
          <Pressable accessibilityRole="link" onPress={() => router.push("/profile")}>
            <Text style={{ color: colors.ink2, textDecorationLine: "underline" }}>Make this your chapter</Text>
          </Pressable>
        )}
      </View>

      {isMine && (
        <ComposePrompt
          label={`Share something with members in ${chapter.city}.`}
          chapter
          notice={me?.access.muted ? mutedNotice(me.access.muted) : null}
        />
      )}

      <Section title={`From ${chapter.city}`}>
        {posts.length === 0 ? (
          <Empty
            title={`There are no ${chapter.city} posts yet.`}
            body={
              isMine
                ? "Posts shared with the chapter appear here. A good first one: where do people refer locally, or who fancies a coffee?"
                : "When members here share something with their chapter, it will appear on this page."
            }
          />
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </Section>

      <Card style={{ gap: space.sm }}>
        <Label>Meetups and events</Label>
        {events.length === 0 ? (
          <Small>
            {`Nothing is planned in ${chapter.city} just now. If you'd like to host a meetup, say so in the chapter feed and we'll help you set it up.`}
          </Small>
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </Card>

      <Card style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>Members</Label>
          <Small>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </Small>
        </View>
        {members.length === 0 ? <Small>No members have joined this chapter yet.</Small> : members.map((m) => <PersonRow key={m.id} person={m} />)}
      </Card>
    </Screen>
  );
}
