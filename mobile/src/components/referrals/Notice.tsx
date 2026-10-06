import { View } from "react-native";
import { Text } from "@/components/ui";
import { colors, radius } from "@/theme";

/** A green confirmation or a red problem, as the website shows after a form. */
export function Notice({ tone, children }: { tone: "positive" | "error"; children: string }) {
  const positive = tone === "positive";
  return (
    <View
      accessibilityRole={positive ? "text" : "alert"}
      accessibilityLiveRegion="polite"
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: positive ? "#c7d8cd" : "#e8c3be",
        backgroundColor: positive ? "#e3ece6" : "#f7e9e7",
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}>
      <Text variant="small" style={{ color: positive ? colors.positive : colors.destructive }}>
        {children}
      </Text>
    </View>
  );
}
