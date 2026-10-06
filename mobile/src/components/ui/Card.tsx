import { Pressable, StyleSheet, View, type ViewProps, type PressableProps, type ViewStyle } from "react-native";
import { colors, radius, space } from "@/theme";

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

/** A card the member can tap. */
export function PressableCard({ style, ...props }: Omit<PressableProps, "style"> & { style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.paper2 }, style]} {...props} />
  );
}

export function Rule({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.rule }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
    padding: space.lg,
  },
});
