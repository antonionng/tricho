import { View } from "react-native";
import { Text } from "@/components/ui";
import { colors, fonts, radius } from "@/theme";

/** The month, day and weekday tile on an event card. */
export function DateBlock({ day }: { day: { day: string; month: string; weekday: string } }) {
  return (
    <View
      accessible
      accessibilityLabel={`${day.weekday} ${day.day} ${day.month}`}
      style={{ width: 56, height: 68, borderRadius: radius.lg, backgroundColor: colors.paper2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: colors.muted }}>{day.month}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.8, color: colors.ink }}>{day.day}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.muted }}>{day.weekday}</Text>
    </View>
  );
}
