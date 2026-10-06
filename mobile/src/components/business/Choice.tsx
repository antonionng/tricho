import { Pressable, View } from "react-native";
import { Text } from "@/components/ui";
import { colors, fonts, radius } from "@/theme";
import type { Option } from "./types";

/** A row of pills to pick one option, in place of a select. */
export function Choice({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                justifyContent: "center",
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: selected ? colors.ink : colors.input,
                backgroundColor: selected ? colors.ink : colors.card,
              }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: selected ? colors.onInk : colors.ink2 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
