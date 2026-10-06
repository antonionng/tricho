import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { colors, type as t } from "@/theme";

type Variant = keyof typeof t;

export function Text({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[t[variant] as TextStyle, style]} />;
}

export const Display = (p: TextProps) => <Text variant="display" accessibilityRole="header" {...p} />;
export const Title = (p: TextProps) => <Text variant="title" accessibilityRole="header" {...p} />;
export const Heading = (p: TextProps) => <Text variant="heading" {...p} />;
export const Label = (p: TextProps) => <Text variant="label" {...p} />;
export const Small = (p: TextProps) => <Text variant="small" {...p} />;
export const Muted = ({ style, ...p }: TextProps) => <Text style={[{ color: colors.muted }, style]} {...p} />;
