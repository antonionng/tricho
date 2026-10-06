import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react-native";
import { Button, ErrorState, Input, Label, Loading, Small, Text } from "@/components/ui";
import { Notice } from "@/components/community/ComposePrompt";
import { refreshFeeds, useRooms } from "@/components/community/queries";
import { mutedNotice } from "@/components/community/format";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { colors, fonts, gutter, radius, space } from "@/theme";

/** Starts a conversation in a room, optionally shared with the member's chapter too. */
export default function NewPostScreen() {
  const params = useLocalSearchParams<{ space?: string; chapter?: string }>();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const rooms = useRooms();
  const postable = rooms.data?.rooms.filter((r) => r.canPost) ?? [];
  const locked = !!params.space && postable.some((r) => r.id === params.space);

  const [chosen, setChosen] = useState<string | null>(null);
  const roomId = chosen ?? (locked ? params.space! : (postable.find((r) => r.id === "lounge")?.id ?? postable[0]?.id));
  const room = postable.find((r) => r.id === roomId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [chapter, setChapter] = useState(params.chapter === "1");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const post = async () => {
    if (!roomId) return;
    if (content.trim().length < 2) return setError("Write a little more before posting.");
    setSending(true);
    setError(null);
    try {
      const res = await api<{ id?: string }>("community", { body: { space: roomId, title, content, chapter } });
      await refreshFeeds(qc);
      router.back();
      if (res.id) router.push(`/community/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    if (!content.trim() && !title.trim()) return router.back();
    Alert.alert("Discard this post?", "What you have written will not be saved.", [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const blocked = me?.access.muted
    ? mutedNotice(me.access.muted)
    : rooms.data && postable.length === 0
      ? "Posting here is for Professional members. You are welcome to read along."
      : null;

  const header = (
    <Stack.Screen
      options={{
        presentation: "modal",
        title: "New post",
        headerLeft: () => <Button title="Cancel" variant="ghost" size="sm" onPress={close} />,
        headerRight: () => <Button title="Post" size="sm" onPress={post} loading={sending} disabled={!!blocked || !roomId || content.trim().length < 2} />,
      }}
    />
  );

  if (rooms.isPending) return (<>{header}<Loading /></>);
  if (rooms.isError) return (<>{header}<ErrorState error={rooms.error} onRetry={() => rooms.refetch()} /></>);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header}
      <ScrollView contentContainerStyle={{ padding: gutter, gap: space.lg, paddingBottom: space.xxxl }} keyboardShouldPersistTaps="handled">
        {blocked ? (
          <Notice>{blocked}</Notice>
        ) : (
          <>
            {locked ? (
              <Text>
                Posting in <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{room?.label}</Text>
              </Text>
            ) : (
              <View style={{ gap: space.sm }}>
                <Label>Space</Label>
                <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card, overflow: "hidden" }}>
                  {postable.map((r, i) => {
                    const on = r.id === roomId;
                    return (
                      <Pressable
                        key={r.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        onPress={() => setChosen(r.id)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: space.md,
                          paddingHorizontal: space.lg,
                          paddingVertical: 13,
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: colors.rule,
                          backgroundColor: pressed ? colors.paper2 : "transparent",
                        })}>
                        <Text style={{ flex: 1, fontFamily: on ? fonts.sansSemibold : fonts.sans, color: colors.ink }}>{r.label}</Text>
                        {on && <Check size={18} color={colors.ink} strokeWidth={1.75} />}
                      </Pressable>
                    );
                  })}
                </View>
                {room?.blurb ? <Small>{room.blurb}</Small> : null}
              </View>
            )}

            <Input value={title} onChangeText={setTitle} maxLength={140} placeholder="Title (optional)" accessibilityLabel="Title" />
            <Input
              value={content}
              onChangeText={(v) => {
                setContent(v);
                if (error) setError(null);
              }}
              multiline
              maxLength={5000}
              placeholder={room?.prompt || "What would you like to share?"}
              accessibilityLabel="Your post"
              style={{ minHeight: 180 }}
              autoFocus
              error={error}
            />

            {rooms.data.chapter && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Text style={{ flex: 1 }}>Also show this in the {rooms.data.chapter.city} chapter</Text>
                <Switch value={chapter} onValueChange={setChapter} trackColor={{ true: colors.ink, false: colors.paper3 }} accessibilityLabel={`Also show this in the ${rooms.data.chapter.city} chapter`} />
              </View>
            )}

            <Small>Never share anything that could identify a client.</Small>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
