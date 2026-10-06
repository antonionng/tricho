import { ScrollView, View, Pressable, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ErrorState, Loading, Rule, Screen, Small, Text } from "@/components/ui";
import { PlainBody } from "@/components/learn/PlainBody";
import { Cover } from "@/components/trichozette/Cover";
import { PageView } from "@/components/trichozette/PageView";
import { magText } from "@/components/trichozette/Blocks";
import { gazetteKey, mag, type Edition, type GazetteItem } from "@/components/trichozette/types";
import { api } from "@/lib/api";
import { colors, fonts, gutter, space, type as t } from "@/theme";

/** An edition, read as one long magazine scroll: cover, standfirst, each page, then the sources. */
function EditionReader({ edition }: { edition: Edition }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: mag.paper }} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: edition.label, headerStyle: { backgroundColor: mag.paper } }} />
      <Cover edition={edition} width={width} />
      <View style={{ paddingHorizontal: gutter, paddingVertical: space.xxl, gap: space.md, backgroundColor: mag.paper }}>
        <Text style={magText.caps}>{edition.theme}</Text>
        <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 22, lineHeight: 29, color: mag.ink }}>{edition.standfirst}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: mag.ink, marginHorizontal: gutter }} />
      {edition.pages.map((p, i) => (
        <PageView key={i} page={p} />
      ))}
      {edition.sources.length > 0 && (
        <View style={{ paddingHorizontal: gutter, paddingVertical: space.xxl, gap: space.md, borderTopWidth: 1, borderColor: mag.ink, backgroundColor: mag.paper }}>
          <Text style={magText.caps}>Sources</Text>
          {edition.sources.map((s, i) => (
            <Pressable key={s.url + i} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(s.url)} hitSlop={4}>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: mag.soft }}>
                {i + 1}. <Text style={{ textDecorationLine: "underline", color: mag.ink }}>{s.label}</Text>
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ height: space.xxxl }} />
    </ScrollView>
  );
}

/** An edition by its slug, or one of the month's articles by its id, as on /members/trichozette/[id]. */
export default function GazetteItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: [...gazetteKey, id], queryFn: () => api<GazetteItem>(`trichozette/${id}`) });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  if (q.data.type === "edition") return <EditionReader edition={q.data.edition} />;

  const a = q.data.article;
  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Trichozette" }} />
      <View style={{ gap: space.md }}>
        <Text style={t.label}>{a.label}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.didone, fontSize: 38, lineHeight: 41, letterSpacing: -0.8, color: colors.ink }}>
          {a.title}
        </Text>
        {a.summary && <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 20, lineHeight: 27, color: colors.ink2 }}>{a.summary}</Text>}
        <Small>{a.date}</Small>
      </View>
      <Rule />
      <PlainBody blocks={a.blocks} />
    </Screen>
  );
}
