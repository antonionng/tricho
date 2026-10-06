import { forwardRef } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius } from "@/theme";
import { Small, Text } from "./Text";

type Props = TextInputProps & { label?: string; hint?: string; error?: string | null };

export const Input = forwardRef<TextInput, Props>(function Input({ label, hint, error, style, multiline, ...props }, ref) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mute}
        multiline={multiline}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.multiline, !!error && { borderColor: colors.destructive }, style]}
        {...props}
      />
      {error ? <Small style={{ color: colors.destructive }}>{error}</Small> : hint ? <Small>{hint}</Small> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
});
