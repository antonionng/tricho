import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, ErrorState, Loading, Muted, Screen, Title } from "@/components/ui";
import { PerkCard } from "@/components/perks/PerkCard";
import { perksKey, type Perk } from "@/components/perks/types";
import { api } from "@/lib/api";
import { space } from "@/theme";

/** Member perks from approved partners, as on /members/perks. */
export default function PerksScreen() {
  const q = useQuery({ queryKey: perksKey, queryFn: () => api<{ perks: Perk[] }>("perks") });
  const counted = useRef(false);
  const perks = q.data?.perks;

  // Count each perk once it has been shown, like the website does after the page loads.
  useEffect(() => {
    if (counted.current || !perks?.length) return;
    counted.current = true;
    api("perks/views", { body: { ids: perks.map((p) => p.id) } }).catch(() => {});
  }, [perks]);

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Member perks" }} />
      <View style={{ gap: space.sm }}>
        <Title>Member perks</Title>
        <Muted>Offers from the partners who support Trichollective. Every offer here is for members only.</Muted>
      </View>
      {q.data.perks.length === 0 ? (
        <Empty
          title="There are no perks just yet."
          body="We are choosing our first partners now, and their offers will appear here as soon as they are agreed. We only list perks from companies we have approved ourselves."
        />
      ) : (
        q.data.perks.map((p) => <PerkCard key={p.id} perk={p} />)
      )}
    </Screen>
  );
}
