import { View } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, ErrorState, Heading, Loading, Muted, PressableCard, Screen, Small, Text } from "@/components/ui";
import { Shelf, ShelfTitle } from "@/components/trichozette/Shelf";
import { gazetteKey, type GazetteHome } from "@/components/trichozette/types";
import { api } from "@/lib/api";
import { colors, fonts, space } from "@/theme";

/** The Trichozette: the library of editions, the look-back archive, and each month's articles. */
export default function TrichozetteScreen() {
  const q = useQuery({ queryKey: gazetteKey, queryFn: () => api<GazetteHome>("trichozette") });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const { editions, archive, months } = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch} contentStyle={{ gap: space.xl }}>
      <Stack.Screen options={{ title: "Trichozette" }} />
      <View style={{ gap: space.sm }}>
        <Text style={{ fontFamily: fonts.didone, fontSize: 44, lineHeight: 46, letterSpacing: -1, color: colors.ink }} accessibilityRole="header">
          Trichozette
        </Text>
        <Muted>News, research and practice notes for hair and scalp professionals, gathered each month and written plainly.</Muted>
      </View>

      {editions.length > 0 && (
        <View style={{ gap: space.lg }}>
          <ShelfTitle title="The library" />
          <Shelf editions={editions} width={170} />
        </View>
      )}

      {archive.length > 0 && (
        <View style={{ gap: space.lg }}>
          <ShelfTitle title="Four years in review" body="What really changed between 2023 and 2026, in the salon, the trichology clinic and the consulting room, and what it means for your practice." />
          <Shelf editions={archive} width={130} />
        </View>
      )}

      {months.length === 0 ? (
        <Empty title="This month's pieces are being prepared." body="New articles, including Karley's column, appear here as soon as they're published." />
      ) : (
        months.map((m, i) => (
          <View key={m.month} style={{ gap: space.md }}>
            <ShelfTitle title={`Trichozette, ${m.month}`} />
            {m.items.map((a, j) => {
              const lead = i === 0 && j === 0;
              return (
                <PressableCard key={a.id} onPress={() => router.push(`/trichozette/${a.id}`)} accessibilityLabel={a.title} style={{ gap: space.sm }}>
                  <Small>{a.date}</Small>
                  {lead ? (
                    <Text style={{ fontFamily: fonts.didone, fontSize: 30, lineHeight: 33, color: colors.ink }}>{a.title}</Text>
                  ) : (
                    <Heading>{a.title}</Heading>
                  )}
                  {a.summary && <Text numberOfLines={3}>{a.summary}</Text>}
                </PressableCard>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}
