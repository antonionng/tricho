import { useState } from "react";
import { Alert, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react-native";
import { Text } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, radius } from "@/theme";
import { patchById } from "./format";

/** "Useful" on a post or reply. Shows the change at once and keeps every cached copy in step. */
export function UsefulButton({
  postId,
  commentId,
  count,
  reacted,
  size = "sm",
}: {
  postId?: string;
  commentId?: string;
  count: number;
  reacted: boolean;
  size?: "xs" | "sm" | "lg";
}) {
  const qc = useQueryClient();
  const [state, setState] = useState({ count, reacted });
  const [busy, setBusy] = useState(false);
  // Follow the server's numbers when the cached post is refreshed.
  const [synced, setSynced] = useState({ count, reacted });
  if (synced.count !== count || synced.reacted !== reacted) {
    setSynced({ count, reacted });
    setState({ count, reacted });
  }

  const id = (commentId ?? postId)!;
  const toggle = async () => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    const before = state;
    setState({ reacted: !before.reacted, count: before.count + (before.reacted ? -1 : 1) });
    setBusy(true);
    try {
      const res = await api<{ useful: number; reacted: boolean }>(commentId ? `community/comments/${commentId}/useful` : `community/${postId}/useful`, {
        method: "POST",
      });
      const patch = { useful: res.useful, reacted: res.reacted };
      for (const key of [["community"], ["home"], ["chapters"]]) {
        qc.setQueriesData({ queryKey: key }, (data: unknown) => (data === undefined ? data : patchById(data, id, patch)));
      }
    } catch (error) {
      setState(before);
      Alert.alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const height = { xs: 32, sm: 38, lg: 44 }[size];
  const fg = state.reacted ? colors.onInk : colors.ink2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: state.reacted }}
      accessibilityLabel={`Useful, ${state.count}`}
      onPress={toggle}
      hitSlop={6}
      style={({ pressed }) => ({
        height,
        paddingHorizontal: size === "xs" ? 10 : 13,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: state.reacted ? colors.ink : colors.rule,
        backgroundColor: state.reacted ? colors.ink : "transparent",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        opacity: pressed ? 0.75 : 1,
      })}>
      <ThumbsUp size={15} color={fg} strokeWidth={1.75} />
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: fg }}>Useful{state.count > 0 ? ` · ${state.count}` : ""}</Text>
    </Pressable>
  );
}
