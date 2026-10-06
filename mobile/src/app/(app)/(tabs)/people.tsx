import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { Search, X } from "lucide-react-native";
import { Empty, ErrorState, Loading, Muted, Small } from "@/components/ui";
import { PersonRow } from "@/components/people/PersonRow";
import { ProfessionFilter } from "@/components/people/ProfessionFilter";
import type { PeoplePage } from "@/components/people/types";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query";
import { colors, fonts, gutter, radius, space } from "@/theme";

// Shown before the first page arrives, and kept in step with the website's disciplines.
const DISCIPLINES = [
  { id: "cosmetic", label: "Cosmetic" },
  { id: "clinical", label: "Clinical" },
  { id: "medical", label: "Medical" },
  { id: "brand", label: "Business" },
];

/** The member directory: search by name, city, practice, specialism or discipline. */
export default function PeopleTab() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [profession, setProfession] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);

  const key = useMemo(() => ["people", "list", q, profession] as const, [q, profession]);
  const list = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (profession) params.set("profession", profession);
      if (pageParam) params.set("cursor", pageParam);
      const qs = params.toString();
      return api<PeoplePage>(`people${qs ? `?${qs}` : ""}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: (prev) => prev,
  });

  const people = useMemo(() => list.data?.pages.flatMap((p) => p.people) ?? [], [list.data]);
  const total = list.data?.pages[0]?.total ?? 0;
  const options = list.data?.pages[0]?.professions ?? DISCIPLINES;

  const setFollowing = (id: string, following: boolean) =>
    queryClient.setQueryData<InfiniteData<PeoplePage>>(key, (data) =>
      data
        ? { ...data, pages: data.pages.map((p) => ({ ...p, people: p.people.map((x) => (x.id === id ? { ...x, following } : x)) })) }
        : data
    );

  const filtered = !!q || !!profession;
  const [pulling, setPulling] = useState(false);
  const refresh = async () => {
    setPulling(true);
    await list.refetch().finally(() => setPulling(false));
  };

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.md }}>
      <Muted style={{ paddingHorizontal: gutter }}>
        Find colleagues by name, city, practice, specialism or discipline. Follow people to see them more often, or send a message to say hello.
      </Muted>
      <View style={{ paddingHorizontal: gutter }}>
        <View style={styles.search}>
          <Search size={17} color={colors.mute} strokeWidth={1.75} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Try a town, trichologist, a clinic or a name"
            placeholderTextColor={colors.mute}
            accessibilityLabel="Search members"
            returnKeyType="search"
            autoCorrect={false}
            style={styles.input}
          />
          {text ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear the search" hitSlop={10} onPress={() => setText("")}>
              <X size={17} color={colors.muted} strokeWidth={1.75} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ProfessionFilter options={options} value={profession} onChange={setProfession} />
      {filtered && !list.isPending && (
        <Small style={{ paddingHorizontal: gutter }}>
          {total === 0 ? "No members match." : `${total} ${total === 1 ? "member matches" : "members match"}.`}
        </Small>
      )}
    </View>
  );

  if (list.isError && !list.data) return <ErrorState error={list.error} onRetry={list.refetch} />;

  return (
    <FlatList
      data={people}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: gutter }}>
          <PersonRow person={item} onFollowChange={(f) => setFollowing(item.id, f)} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        list.isPending ? (
          <Loading />
        ) : (
          <Empty
            title={filtered ? "Nobody matches that description yet." : "The directory is filling up."}
            body={filtered ? "Try a city, a discipline such as clinical or cosmetic, or part of a name." : "Members appear here once they've finished settling in."}
          />
        )
      }
      ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 16 }} /> : null}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
      }}
      refreshControl={<RefreshControl refreshing={pulling} onRefresh={refresh} tintColor={colors.ink} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingTop: space.lg, paddingBottom: space.xxxl }}
    />
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: 18,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.ink, paddingVertical: 12 },
});
