import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import { PenLine } from "lucide-react-native";
import { Text } from "@/components/ui";
import { colors, radius } from "@/theme";

/** The tap target that opens the composer, or why this member can't post here. */
export function ComposePrompt({ label, space, chapter, notice }: { label: string; space?: string; chapter?: boolean; notice?: string | null }) {
  if (notice) return <Notice>{notice}</Notice>;
  const params = new URLSearchParams();
  if (space) params.set("space", space);
  if (chapter) params.set("chapter", "1");
  const query = params.toString();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/community/new${query ? `?${query}` : ""}` as Href)}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.rule,
        backgroundColor: pressed ? colors.paper2 : colors.card,
      })}>
      <PenLine size={20} color={colors.ink} strokeWidth={1.75} />
      <Text style={{ flex: 1, color: colors.muted }}>{label}</Text>
    </Pressable>
  );
}

/** A quiet panel that explains something, e.g. why posting is closed. */
export function Notice({ children }: { children: string }) {
  return (
    <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.paper2, padding: 16 }}>
      <Text style={{ fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}
