import { useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, ErrorState, Loading, Rule } from "@/components/ui";
import { ThreadRow } from "@/components/messages/ThreadRow";
import type { Thread } from "@/components/messages/types";
import { api } from "@/lib/api";
import { colors, gutter } from "@/theme";

/** Private conversations with other members, most recent first. */
export default function MessagesScreen() {
  const inbox = useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: () => api<{ threads: Thread[] }>("messages"),
    refetchInterval: 30_000,
  });

  // Coming back from a conversation should clear its unread dot.
  const { refetch } = inbox;
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const threads = inbox.data?.threads ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Messages" }} />
      {inbox.isPending ? (
        <Loading />
      ) : inbox.isError ? (
        <ErrorState error={inbox.error} onRetry={inbox.refetch} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <ThreadRow thread={item} />}
          ItemSeparatorComponent={() => <Rule style={{ marginLeft: gutter + 56 }} />}
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, backgroundColor: colors.paper }}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={inbox.refetch} tintColor={colors.ink} />}
          ListEmptyComponent={
            <Empty
              title="You have no conversations yet."
              body="Open anyone's profile and choose Message to start one. A short hello after a gathering goes a long way."
              action={{ title: "Find members", onPress: () => router.push("/people") }}
            />
          }
        />
      )}
    </>
  );
}
