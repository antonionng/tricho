import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { ArrowUp, ArrowUpRight, Check, Copy, RotateCcw, Search, Sparkles, Square, SquarePen } from "lucide-react-native";
import { Button, Card, ErrorState, Heading, Label, Loading, Muted, Screen, Small, Text, Title } from "@/components/ui";
import { Markdown } from "@/components/assistant/Markdown";
import { textOf, type ChatMessage } from "@/components/assistant/stream";
import { useAssistantChat } from "@/components/assistant/useAssistantChat";
import { ApiError } from "@/lib/api";
import { useMe } from "@/lib/me";
import { colors, fonts, gutter, radius, space } from "@/theme";

// The same suggestions as the website's Assistant.
const BY_PROFESSION: Record<string, string[]> = {
  cosmetic: [
    "Client has traction from tight styles — what should I ask before referring?",
    "How do I explain shedding with telogen timing without diagnosing?",
    "When is salon shedding a referral rather than a styling problem?",
  ],
  clinical: [
    "Diffuse thinning over 6 months, normal scalp — how should I structure the consult?",
    "What red flags would push me to refer a patchy hair loss case urgently?",
    "Draft a client-education summary for telogen effluvium.",
  ],
  medical: [
    "What should a useful trichology referral letter include?",
    "Which baseline bloods are reasonable for unexplained shedding?",
    "Paediatric patchy loss — what belongs with dermatology urgently?",
  ],
  brand: ["How should I present a product education session without overclaiming?"],
};
const DEFAULT_SUGGESTIONS = BY_PROFESSION.clinical;

const DISCLAIMER = "Educational support only. It is not a diagnosis and does not replace your clinical judgement.";

export default function AssistantScreen() {
  const me = useMe();
  if (me.isLoading) return <Loading />;
  if (me.error || !me.data) return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  const { access } = me.data;

  if (!access.member) {
    return (
      <>
        <Stack.Screen options={{ title: "Assistant" }} />
        <ErrorState error={new ApiError(402, "The Assistant is part of Professional membership.")} />
      </>
    );
  }
  if (!access.professional) return <Upsell />;
  return <Chat profession={access.profession} />;
}

/** For members without Professional: the website's upsell, in the same words. */
function Upsell() {
  const points = [
    "Referral routes across cosmetic, clinical and medical practice",
    "Consultation structure and red flags to look out for",
    "Drafts of client-education notes and referral letters",
    "Answers grounded in our reviewed library",
  ];
  return (
    <Screen>
      <Stack.Screen options={{ title: "Assistant" }} />
      <Label>Assistant</Label>
      <Title>A second pair of eyes, for professionals</Title>
      <Card style={{ gap: space.md }}>
        <Heading>The Assistant comes with Professional</Heading>
        <Muted>
          It helps qualified practitioners structure a consultation, think through referral routes and draft client notes, drawing on the Trichollective library. It supports your
          judgement and never replaces it.
        </Muted>
        {points.map((p) => (
          <View key={p} style={{ flexDirection: "row", gap: space.md }}>
            <Check size={16} color={colors.ink} strokeWidth={2} style={{ marginTop: 3 }} />
            <Text style={{ flex: 1, color: colors.ink }}>{p}.</Text>
          </View>
        ))}
        <Button title="See membership" onPress={() => router.push("/membership")} />
      </Card>
    </Screen>
  );
}

function Chat({ profession }: { profession: string | null }) {
  const chat = useAssistantChat();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const pinned = useRef(true);
  const [input, setInput] = useState("");
  const empty = chat.messages.length === 0;
  const suggestions = (profession && BY_PROFESSION[profession]) || DEFAULT_SUGGESTIONS;

  const submit = (text: string) => {
    if (!text.trim() || chat.busy) return;
    pinned.current = true;
    chat.send(text);
    setInput("");
  };

  const last = chat.messages[chat.messages.length - 1];
  const waiting = chat.busy && (last?.role === "user" || (last?.role === "assistant" && last.parts.length === 0));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={headerHeight}>
      <Stack.Screen
        options={{
          title: "Assistant",
          headerRight: empty
            ? undefined
            : () => (
                <Pressable accessibilityRole="button" accessibilityLabel="New conversation" hitSlop={10} onPress={chat.reset}>
                  <SquarePen size={21} color={colors.ink} strokeWidth={1.75} />
                </Pressable>
              ),
        }}
      />

      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: gutter, gap: space.xl, flexGrow: 1, justifyContent: empty ? "center" : "flex-start" }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          pinned.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
        }}
        scrollEventThrottle={64}
        onContentSizeChange={() => {
          // Follow the reply as it streams, unless the member has scrolled up to read.
          if (pinned.current) scroll.current?.scrollToEnd({ animated: false });
        }}>
        {empty ? (
          <View style={{ gap: space.xl }}>
            <View style={{ alignItems: "center", gap: space.md }}>
              <View style={styles.avatarLarge}>
                <Sparkles size={22} color={colors.onInk} strokeWidth={1.75} />
              </View>
              <Title style={{ textAlign: "center" }}>How can I help with your practice today?</Title>
              <Muted style={{ textAlign: "center" }}>Structure a consultation, think through referral routes or draft a client note.</Muted>
            </View>
            <View style={{ gap: space.sm }}>
              <Label>Try asking</Label>
              <Card style={{ padding: 0 }}>
                {suggestions.map((s, i) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    onPress={() => submit(s)}
                    style={({ pressed }) => [styles.suggestion, i > 0 && styles.divider, pressed && { backgroundColor: colors.paper2 }]}>
                    <Text style={{ flex: 1, color: colors.ink2 }}>{s}</Text>
                    <ArrowUpRight size={16} color={colors.mute} strokeWidth={1.75} />
                  </Pressable>
                ))}
              </Card>
            </View>
          </View>
        ) : (
          chat.messages.map((m, i) =>
            m.role === "user" ? (
              <View key={m.id} style={styles.userBubble}>
                <Text selectable style={{ color: colors.onInk, fontSize: 15, lineHeight: 22 }}>
                  {textOf(m.parts)}
                </Text>
              </View>
            ) : (
              <Reply
                key={m.id}
                message={m}
                streaming={chat.busy && i === chat.messages.length - 1}
                canRetry={!chat.busy && i === chat.messages.length - 1}
                onRetry={chat.regenerate}
              />
            )
          )
        )}

        {waiting && (
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }} accessibilityLabel="The Assistant is thinking">
            <Avatar />
            <ActivityIndicator color={colors.muted} />
          </View>
        )}

        {chat.error && (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Avatar />
            <View style={styles.error}>
              <Text style={{ color: colors.destructive }}>{chat.error}</Text>
              <Button title="Try again" icon={RotateCcw} variant="ghost" size="sm" style={{ paddingHorizontal: 0 }} onPress={chat.regenerate} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={empty ? "Describe the case or ask a question" : "Ask a follow-up"}
            placeholderTextColor={colors.mute}
            accessibilityLabel="Your question"
            multiline
            style={styles.input}
          />
          {chat.busy ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Stop the reply" onPress={chat.stop} style={styles.send}>
              <Square size={13} color={colors.onInk} fill={colors.onInk} strokeWidth={1.75} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !input.trim() }}
              disabled={!input.trim()}
              onPress={() => submit(input)}
              style={[styles.send, !input.trim() && { backgroundColor: colors.paper3 }]}>
              <ArrowUp size={19} color={input.trim() ? colors.onInk : colors.mute} strokeWidth={2} />
            </Pressable>
          )}
        </View>
        <Small style={{ textAlign: "center", fontSize: 11 }}>{DISCLAIMER}</Small>
      </View>
    </KeyboardAvoidingView>
  );
}

function Reply({ message, streaming, canRetry, onRetry }: { message: ChatMessage; streaming: boolean; canRetry: boolean; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = textOf(message.parts);
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <Avatar />
      <View style={{ flex: 1, gap: space.sm, paddingTop: 4 }}>
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            part.text ? <Markdown key={i} source={part.text} /> : null
          ) : part.name === "searchDirectory" ? (
            <View key={i} style={styles.tool}>
              <Search size={13} color={colors.ink2} strokeWidth={1.75} />
              <Small style={{ color: colors.ink2 }}>{part.done ? "Searched the directory" : "Searching the directory…"}</Small>
            </View>
          ) : null
        )}
        {!streaming && !!text && (
          <View style={{ flexDirection: "row", gap: space.xs }}>
            <IconButton
              label={copied ? "Copied" : "Copy"}
              onPress={async () => {
                await Clipboard.setStringAsync(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}>
              {copied ? <Check size={16} color={colors.muted} strokeWidth={1.75} /> : <Copy size={16} color={colors.muted} strokeWidth={1.75} />}
            </IconButton>
            {canRetry && (
              <IconButton label="Write a new reply" onPress={onRetry}>
                <RotateCcw size={16} color={colors.muted} strokeWidth={1.75} />
              </IconButton>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }, pressed && { backgroundColor: colors.paper2 }]}>
      {children}
    </Pressable>
  );
}

function Avatar() {
  return (
    <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
      <Sparkles size={15} color={colors.onInk} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarLarge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  suggestion: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  userBubble: { alignSelf: "flex-end", maxWidth: "85%", backgroundColor: colors.ink, borderRadius: radius.xxl, borderBottomRightRadius: 6, paddingHorizontal: space.lg, paddingVertical: space.md },
  tool: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.paper2, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  error: { flex: 1, gap: space.xs, borderWidth: 1, borderColor: "#e4bdb7", backgroundColor: "#f8ecea", borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md },
  composerWrap: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.sm, backgroundColor: colors.paper },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.rule,
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 6,
    paddingLeft: space.lg,
  },
  input: { flex: 1, maxHeight: 160, minHeight: 40, paddingTop: 10, paddingBottom: 10, fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
