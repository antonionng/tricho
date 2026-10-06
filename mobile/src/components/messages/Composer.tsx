import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ArrowUp } from "lucide-react-native";
import { Small } from "@/components/ui";
import { colors, fonts, gutter, radius } from "@/theme";

/** The message box pinned to the bottom of a conversation. */
export function Composer({
  onSend,
  sending,
  error,
  bottomInset = 0,
}: {
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
  error?: string | null;
  bottomInset?: number;
}) {
  const [body, setBody] = useState("");
  const ready = body.trim().length > 0 && !sending;

  const send = async () => {
    if (!ready) return;
    const text = body.trim();
    setBody("");
    // Put the text back if it didn't go, so nothing the member wrote is lost.
    if (!(await onSend(text))) setBody(text);
  };

  return (
    <View style={[styles.bar, { paddingBottom: 8 + bottomInset }]}>
      {error ? <Small style={{ color: colors.destructive, paddingHorizontal: 4, paddingBottom: 6 }}>{error}</Small> : null}
      <View style={styles.row}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write a message"
          placeholderTextColor={colors.mute}
          multiline
          maxLength={4000}
          accessibilityLabel="Message"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={send}
          hitSlop={6}
          style={({ pressed }) => [styles.send, !ready && { opacity: 0.35 }, pressed && { opacity: 0.7 }]}>
          <ArrowUp size={20} color={colors.onInk} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.rule,
    paddingHorizontal: gutter - 8,
    paddingTop: 8,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.xxl,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
