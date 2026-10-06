import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react-native";
import { Button, Card, Empty, ErrorState, Heading, Loading, Muted, Title } from "@/components/ui";
import { ComposePrompt } from "@/components/community/ComposePrompt";
import { PostCard } from "@/components/community/PostCard";
import { RoomChips } from "@/components/community/RoomChips";
import { communityKeys, useRooms } from "@/components/community/queries";
import type { FeedPage } from "@/components/community/types";
import { api, webUrl } from "@/lib/api";
import { colors, gutter, space } from "@/theme";
import * as WebBrowser from "expo-web-browser";

export default function CommunityTab() {
  const params = useLocalSearchParams<{ space?: string }>();
  const [roomId, setRoomId] = useState<string | undefined>(params.space || undefined);
  const rooms = useRooms();
  // A link such as "Introduce yourself" can land here with a room already chosen.
  const [linkedSpace, setLinkedSpace] = useState(params.space);
  if (params.space !== linkedSpace) {
    setLinkedSpace(params.space);
    if (params.space !== undefined) setRoomId(params.space || undefined);
  }

  const feed = useInfiniteQuery({
    queryKey: communityKeys.feed(roomId),
    queryFn: ({ pageParam, signal }) => {
      const q = new URLSearchParams();
      if (roomId) q.set("space", roomId);
      if (pageParam) q.set("cursor", pageParam);
      return api<FeedPage>(`community?${q}`, { signal });
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([feed.refetch(), rooms.refetch()]).finally(() => setRefreshing(false));
  }, [feed, rooms]);

  const choose = (id: string | undefined) => {
    setRoomId(id);
    router.setParams({ space: id ?? "" });
  };

  const first = feed.data?.pages[0];
  const posts = feed.data?.pages.flatMap((p) => p.posts) ?? [];
  const room = rooms.data?.rooms.find((r) => r.id === roomId) ?? first?.room;

  const header = (
    <View style={{ gap: space.lg, paddingBottom: space.lg }}>
      {rooms.data && <RoomChips rooms={rooms.data.rooms} active={roomId} onChange={choose} />}
      <View style={{ gap: space.sm }}>
        <Title>{room?.label ?? "All spaces"}</Title>
        <Muted>{room?.blurb ?? "Conversation from every space you can read, newest first. Pinned posts from the team sit at the top."}</Muted>
      </View>
      {first?.locked ? (
        <Card style={{ gap: space.md }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.paper2, alignItems: "center", justifyContent: "center" }}>
            <Lock size={20} color={colors.ink} strokeWidth={1.75} />
          </View>
          <Heading>{first.locked.title}</Heading>
          <Muted>{first.locked.body}</Muted>
          <Button title="See Professional" onPress={() => WebBrowser.openBrowserAsync(webUrl("/pricing#professional")).catch(() => {})} />
        </Card>
      ) : first ? (
        <ComposePrompt
          label={room ? room.prompt || `Start a conversation in ${room.label}.` : "Share something with the collective."}
          space={roomId}
          notice={first.posting.canPost ? null : first.posting.notice}
        />
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={first?.locked ? [] : posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PostCard post={item} showSpace={!roomId} />}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        feed.isPending ? (
          <Loading />
        ) : feed.isError ? (
          <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
        ) : first?.locked ? null : (
          <Empty
            title={room ? `Nothing in ${room.label} yet.` : "There are no posts yet."}
            body="Be the first to start a conversation here. A question is often the best way in."
          />
        )
      }
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.ink} style={{ marginTop: space.lg }} /> : null}
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink} />}
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: gutter, paddingBottom: space.xxxl }}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}
