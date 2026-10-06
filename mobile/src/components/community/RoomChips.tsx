import { Pressable, ScrollView } from "react-native";
import { Lock } from "lucide-react-native";
import { Text } from "@/components/ui";
import { colors, fonts, gutter, radius } from "@/theme";
import type { RoomInfo } from "./types";

/** "All spaces" and every room, scrolling sideways, as on the website on a phone. */
export function RoomChips({ rooms, active, onChange }: { rooms: RoomInfo[]; active?: string; onChange: (id: string | undefined) => void }) {
  const items: { id?: string; label: string; locked?: boolean }[] = [
    { id: undefined, label: "All spaces" },
    ...rooms.map((r) => ({ id: r.id, label: r.label, locked: !r.canRead })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -gutter }} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
      {items.map((r) => {
        const on = active === r.id;
        return (
          <Pressable
            key={r.id ?? "all"}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityHint={r.locked ? "For Professional members" : undefined}
            onPress={() => onChange(r.id)}
            style={{
              height: 38,
              paddingHorizontal: 15,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: on ? colors.ink : colors.rule,
              backgroundColor: on ? colors.ink : colors.card,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: on ? colors.onInk : r.locked ? colors.muted : colors.ink2 }}>{r.label}</Text>
            {r.locked && <Lock size={13} color={on ? colors.onInk : colors.muted} strokeWidth={1.75} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
