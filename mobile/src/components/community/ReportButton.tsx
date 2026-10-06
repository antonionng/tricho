import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { Flag } from "lucide-react-native";
import { Button, Heading, Input, Muted, Small, Text } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, gutter, radius, space } from "@/theme";

const REASONS = [
  { id: "identifying", label: "Could identify a client" },
  { id: "unsafe", label: "Unsafe or misleading advice" },
  { id: "promotion", label: "Advertising or self-promotion" },
  { id: "unkind", label: "Unkind or disrespectful" },
  { id: "other", label: "Something else" },
];

/** Reports a post, or a single reply when `commentId` is given, to the team in confidence. */
export function ReportButton({ postId, commentId }: { postId?: string; commentId?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const what = commentId ? "reply" : "post";

  const send = async () => {
    if (!reason) return;
    setSending(true);
    try {
      const res = await api<{ message?: string }>(commentId ? `community/comments/${commentId}/report` : `community/${postId}/report`, {
        body: { reason, detail },
      });
      setDone(res.message ?? "Thank you. The team will look at this quietly and in confidence.");
      setOpen(false);
    } catch (error) {
      Alert.alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (done) return <Small style={{ flexShrink: 1 }}>{done}</Small>;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        hitSlop={6}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 8 }}>
        <Flag size={15} color={colors.muted} strokeWidth={1.75} />
        <Text style={{ fontSize: 13, color: colors.muted }}>Report</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: gutter, gap: space.lg }} keyboardShouldPersistTaps="handled">
            <Heading>What is the problem with this {what}?</Heading>
            <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
              {REASONS.map((r) => {
                const on = reason === r.id;
                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => setReason(r.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: on ? colors.ink : colors.rule,
                      backgroundColor: colors.card,
                    }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: on ? colors.ink : colors.input, alignItems: "center", justifyContent: "center" }}>
                      {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink }} />}
                    </View>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Input
              value={detail}
              onChangeText={setDetail}
              multiline
              maxLength={600}
              placeholder="Anything else we should know (optional)"
              style={{ minHeight: 88 }}
            />
            <Muted style={{ fontSize: 13 }}>Reports are private. The author is not told who made them.</Muted>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: space.sm }}>
              <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
              <Button title="Send report" onPress={send} loading={sending} disabled={!reason} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
