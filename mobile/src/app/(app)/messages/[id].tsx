import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Avatar, ErrorState, Loading, Muted, Text } from "@/components/ui";
import { Bubble, DayLabel } from "@/components/messages/Bubble";
import { Composer } from "@/components/messages/Composer";
import { shortDate, shortName, threadTitle } from "@/components/messages/format";
import { useKeyboardVisible } from "@/components/messages/hooks";
import type { Message, ThreadPage } from "@/components/messages/types";
import { api } from "@/lib/api";
import { meKey } from "@/lib/me";
import { queryClient } from "@/lib/query";
import { colors, fonts, gutter } from "@/theme";

/** A private conversation. New messages arrive every ten seconds while it is open. */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  const [pending, setPending] = useState<Message[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);

  const thread = useInfiniteQuery({
    queryKey: ["messages", "thread", id],
    queryFn: ({ pageParam }) => api<ThreadPage>(`messages/${id}${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: 10_000,
    enabled: !!id,
  });

  // Loading the conversation marks it read on the server, so refresh the badges once it has loaded, and again on leaving.
  const loaded = thread.isSuccess;
  useEffect(() => {
    if (!loaded) return;
    queryClient.invalidateQueries({ queryKey: meKey });
    queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
    return () => {
      queryClient.invalidateQueries({ queryKey: meKey });
      queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
    };
  }, [loaded]);

  const send = useMutation({
    mutationFn: (body: string) => api(`messages/${id}`, { body: { body } }),
  });

  const onSend = async (body: string) => {
    const temp: Message = { id: `pending-${Date.now()}`, body, createdAt: new Date().toISOString(), senderId: "", mine: true };
    setSendError(null);
    setPending((p) => [temp, ...p]);
    try {
      await send.mutateAsync(body);
      await thread.refetch();
      return true;
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Your message didn't send. Please try again.");
      return false;
    } finally {
      setPending((p) => p.filter((m) => m.id !== temp.id));
    }
  };

  const conversation = thread.data?.pages[0]?.conversation;
  const others = conversation?.others ?? [];
  const other = others[0];
  // Newest first, which an inverted list shows at the bottom.
  const messages = useMemo(() => [...pending, ...(thread.data?.pages.flatMap((p) => p.messages) ?? [])], [pending, thread.data]);

  const header = (
    <Stack.Screen
      options={{
        title: conversation ? threadTitle(others) : "Messages",
        headerTitle: other
          ? () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`See ${threadTitle(others)}'s profile`}
                onPress={() => router.push(`/people/${other.id}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 260 }}>
                <Avatar name={other.name} image={other.image} size={30} />
                <Text numberOfLines={1} style={{ fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.ink }}>
                  {threadTitle(others)}
                </Text>
              </Pressable>
            )
          : undefined,
      }}
    />
  );

  if (thread.isPending) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }
  if (thread.isError) {
    return (
      <>
        {header}
        <ErrorState error={thread.error} onRetry={thread.refetch} />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}>
      {header}
      {messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: gutter }}>
          <Muted style={{ textAlign: "center" }}>
            Say hello. Messages are private between you{other?.name ? ` and ${shortName(other.name)}` : ""}.
          </Muted>
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const older = messages[index + 1];
            const day = shortDate(item.createdAt);
            const showDay = !older || shortDate(older.createdAt) !== day;
            return (
              <View>
                {showDay && <DayLabel label={day} />}
                <Bubble message={item} pending={item.id.startsWith("pending-")} />
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 16 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (thread.hasNextPage && !thread.isFetchingNextPage) thread.fetchNextPage();
          }}
          ListFooterComponent={thread.isFetchingNextPage ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 12 }} /> : null}
        />
      )}
      <Composer onSend={onSend} sending={send.isPending} error={sendError} bottomInset={keyboard ? 0 : insets.bottom} />
    </KeyboardAvoidingView>
  );
}
