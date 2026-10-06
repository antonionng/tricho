import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { colors, gutter, space } from "@/theme";
import { Label } from "./Text";

/** A scrolling screen on paper with the standard gutter and pull to refresh. */
export function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle,
  ...props
}: ScrollViewProps & { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; contentStyle?: ViewStyle }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={[{ padding: gutter, paddingBottom: space.xxxl, gap: space.lg }, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.ink} /> : undefined}
      {...props}>
      {children}
    </ScrollView>
  );
}

export function Section({ title, children, style }: { title?: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ gap: space.md }, style]}>
      {title && <Label>{title}</Label>}
      {children}
    </View>
  );
}
