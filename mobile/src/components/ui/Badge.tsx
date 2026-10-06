import { View } from "react-native";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./Text";

/** A small pill, e.g. a room name or "Verified". */
export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "ink" | "positive" }) {
  const bg = tone === "ink" ? colors.ink : tone === "positive" ? "#e3ece6" : colors.paper2;
  const fg = tone === "ink" ? colors.onInk : tone === "positive" ? colors.positive : colors.ink2;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

/** The red dot count on a tab or icon. */
export function CountDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={{ position: "absolute", top: -4, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.destructive, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 11, color: "#fff" }}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}
