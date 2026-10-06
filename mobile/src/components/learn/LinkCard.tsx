import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Heading, PressableCard, Text } from "@/components/ui";
import { colors, space } from "@/theme";

/** A card that leads somewhere else in Learn, with an icon and one sentence. */
export function LinkCard({ icon: Icon, title, body, onPress }: { icon: LucideIcon; title: string; body: string; onPress: () => void }) {
  return (
    <PressableCard onPress={onPress} accessibilityLabel={title} style={{ flexDirection: "row", gap: space.lg, alignItems: "flex-start" }}>
      <Icon size={20} color={colors.ink} strokeWidth={1.75} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Heading>{title}</Heading>
        <Text>{body}</Text>
      </View>
    </PressableCard>
  );
}
