import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { colors, fonts, radius } from "@/theme";
import { Text } from "./Text";

type Props = Omit<PressableProps, "style"> & {
  title: string;
  /** "primary" is the black pill; "secondary" is outlined; "ghost" is text only. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
  icon?: LucideIcon;
  style?: ViewStyle;
  full?: boolean;
};

export function Button({ title, variant = "primary", size = "md", loading, icon: Icon, style, full, disabled, onPress, ...rest }: Props) {
  const fg = variant === "primary" ? colors.onInk : variant === "danger" ? colors.destructive : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        size === "sm" ? styles.sm : styles.md,
        variant === "primary" && styles.primary,
        (variant === "secondary" || variant === "danger") && styles.secondary,
        full && { alignSelf: "stretch" },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {Icon && <Icon size={size === "sm" ? 15 : 17} color={fg} strokeWidth={1.75} />}
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: size === "sm" ? 13 : 15, color: fg }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  md: { minHeight: 48, paddingHorizontal: 22 },
  sm: { minHeight: 36, paddingHorizontal: 14 },
  primary: { backgroundColor: colors.ink },
  secondary: { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.input, backgroundColor: colors.card },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
