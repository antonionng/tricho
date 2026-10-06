import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Small, Text } from "@/components/ui";
import { colors, fonts, gutter, space } from "@/theme";
import { Cover } from "./Cover";
import type { EditionCard } from "./types";

/** Editions as covers in a row that scrolls sideways. */
export function Shelf({ editions, width = 150 }: { editions: EditionCard[]; width?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: space.lg }} style={{ marginHorizontal: -gutter }}>
      {editions.map((e) => (
        <Pressable
          key={e.slug}
          accessibilityRole="button"
          accessibilityLabel={`${e.label}: ${e.title}`}
          onPress={() => router.push(`/trichozette/${e.slug}`)}
          style={({ pressed }) => [{ width, gap: 6 }, pressed && { opacity: 0.8 }]}>
          <Cover edition={e} width={width} />
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 14, lineHeight: 18, color: colors.ink, marginTop: 4 }} numberOfLines={2}>
            {e.title}
          </Text>
          <Small numberOfLines={1}>{e.theme}</Small>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function ShelfTitle({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ gap: 4, borderBottomWidth: 1, borderColor: colors.rule, paddingBottom: space.sm }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.didone, fontSize: 28, lineHeight: 32, color: colors.ink }}>
        {title}
      </Text>
      {body && <Small>{body}</Small>}
    </View>
  );
}
