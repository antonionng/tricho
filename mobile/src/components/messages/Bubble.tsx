import { View } from "react-native";
import { Small, Text } from "@/components/ui";
import { colors, radius } from "@/theme";
import { timeOfDay } from "./format";
import type { Message } from "./types";

/** A chat bubble: the member's own messages on the right in ink, everyone else's on the left on a card. */
export function Bubble({ message, pending }: { message: Message; pending?: boolean }) {
  const mine = message.mine;
  return (
    <View
      style={{
        maxWidth: "85%",
        alignSelf: mine ? "flex-end" : "flex-start",
        backgroundColor: mine ? colors.ink : colors.card,
        borderWidth: mine ? 0 : 1,
        borderColor: colors.rule,
        borderRadius: radius.xxl,
        borderBottomRightRadius: mine ? radius.sm : radius.xxl,
        borderBottomLeftRadius: mine ? radius.xxl : radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 9,
        opacity: pending ? 0.6 : 1,
      }}>
      <Text selectable style={{ color: mine ? colors.onInk : colors.ink, fontSize: 15, lineHeight: 21 }}>
        {message.body}
      </Text>
      <Small style={{ marginTop: 2, fontSize: 11, lineHeight: 14, color: mine ? "rgba(250,249,247,0.6)" : colors.muted }}>
        {pending ? "Sending…" : timeOfDay(message.createdAt)}
      </Small>
    </View>
  );
}

/** The date between messages from different days. */
export function DayLabel({ label }: { label: string }) {
  return <Small style={{ alignSelf: "center", marginVertical: 10, fontSize: 12 }}>{label}</Small>;
}
