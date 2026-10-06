import { View } from "react-native";
import { Heading, Text } from "@/components/ui";
import { space } from "@/theme";
import type { PlainBlock } from "./types";

/** The house format for library pieces and articles: headings and paragraphs, already split by the server. */
export function PlainBody({ blocks }: { blocks: PlainBlock[] }) {
  return (
    <View style={{ gap: space.lg }}>
      {blocks.map((b, i) =>
        b.type === "h2" ? (
          <Heading key={i} accessibilityRole="header" style={{ fontSize: 19, lineHeight: 25, marginTop: space.sm }}>
            {b.text}
          </Heading>
        ) : (
          <Text key={i} style={{ fontSize: 16, lineHeight: 26 }} selectable>
            {b.text}
          </Text>
        )
      )}
    </View>
  );
}
