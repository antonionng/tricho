import { Pressable, ScrollView } from "react-native";
import { Text } from "@/components/ui";
import { colors, fonts, gutter, radius } from "@/theme";

/** Chips to narrow the directory to one discipline. */
export function ProfessionFilter({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const all = [{ id: null as string | null, label: "Everyone" }, ...options];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }} style={{ flexGrow: 0 }}>
      {all.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id ?? "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={({ pressed }) => ({
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: on ? colors.ink : colors.rule,
              backgroundColor: on ? colors.ink : colors.card,
              paddingHorizontal: 14,
              paddingVertical: 7,
              opacity: pressed ? 0.75 : 1,
            })}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: on ? colors.onInk : colors.ink2 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
