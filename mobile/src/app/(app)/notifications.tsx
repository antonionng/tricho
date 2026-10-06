import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { Stack } from "expo-router";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Bell, Briefcase, GraduationCap, MessageCircle, MessagesSquare, ThumbsUp, UserPlus, type LucideIcon } from "lucide-react-native";
import { Empty, ErrorState, Loading, Rule, Small, Text } from "@/components/ui";
import { timeAgo } from "@/components/messages/format";
import { api } from "@/lib/api";
import { meKey } from "@/lib/me";
import { openHref } from "@/lib/push";
import { queryClient } from "@/lib/query";
import { colors, fonts, gutter } from "@/theme";

type Notification = { id: string; kind: string; title: string; href: string | null; createdAt: string; readAt: string | null };
type NotificationPage = { notifications: Notification[]; nextCursor: string | null; unread: number };

const ICONS: Record<string, LucideIcon> = {
  comment: MessagesSquare,
  message: MessageCircle,
  follow: UserPlus,
  useful: ThumbsUp,
  job: Briefcase,
  course: GraduationCap,
};

const refreshBadges = () => queryClient.invalidateQueries({ queryKey: meKey });

/**
 * Replies to the member's posts, new messages and new followers. As on the
 * website, seeing the list marks it read, and what was new stays highlighted
 * for this visit.
 */
export default function NotificationsScreen() {
  const list = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => api<NotificationPage>(`notifications${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const items = useMemo(() => list.data?.pages.flatMap((p) => p.notifications) ?? [], [list.data]);

  // What was unread when the member arrived, kept highlighted after it is marked read.
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const unread = items.filter((n) => !n.readAt).map((n) => n.id);
  if (unread.some((id) => !fresh.has(id))) setFresh(new Set([...fresh, ...unread]));

  const markAll = useMutation({
    mutationFn: () => api("notifications/read", { method: "POST" }),
    onSuccess: refreshBadges,
  });
  const markOne = useMutation({
    mutationFn: (id: string) => api(`notifications/${id}/read`, { method: "POST" }),
    onSuccess: refreshBadges,
  });

  // Seeing the list marks everything read, once per visit and again if more arrive.
  const unreadCount = list.data?.pages[0]?.unread ?? 0;
  const marked = useRef(0);
  useEffect(() => {
    if (unreadCount > 0 && marked.current !== list.dataUpdatedAt) {
      marked.current = list.dataUpdatedAt;
      markAll.mutate();
    }
    // markAll is stable enough; only a new load should trigger this.
  }, [unreadCount, list.dataUpdatedAt]); // eslint-disable-line

  const open = (n: Notification) => {
    if (!n.readAt && !markAll.isSuccess) markOne.mutate(n.id);
    openHref(n.href);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <Row item={item} isNew={!item.readAt || fresh.has(item.id)} onPress={() => open(item)} />}
          ItemSeparatorComponent={() => <Rule style={{ marginLeft: gutter + 52 }} />}
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.paper }}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} tintColor={colors.ink} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <Empty
              title="You have no notifications yet."
              body="When someone replies to your post, follows you or sends a message, you'll see it here."
            />
          }
        />
      )}
    </>
  );
}

function Row({ item, isNew, onPress }: { item: Notification; isNew: boolean; onPress: () => void }) {
  const Icon = ICONS[item.kind] ?? Bell;
  return (
    <Pressable
      accessibilityRole={item.href ? "link" : "text"}
      accessibilityLabel={`${isNew ? "New. " : ""}${item.title}`}
      disabled={!item.href}
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gutter, paddingVertical: 14 },
        pressed && { backgroundColor: colors.paper2 },
      ]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isNew ? colors.ink : colors.paper2,
        }}>
        <Icon size={18} color={isNew ? colors.onInk : colors.ink} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.ink, fontFamily: isNew ? fonts.sansMedium : fonts.sans }}>{item.title}</Text>
        <Small>{timeAgo(item.createdAt)}</Small>
      </View>
      {isNew && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink }} />}
    </Pressable>
  );
}
