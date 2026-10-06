import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Empty, ErrorState, Loading, Muted, Screen, Title } from "@/components/ui";
import { EventCard } from "@/components/events/EventCard";
import { eventsKey, type EventsResponse } from "@/components/events/types";
import { api } from "@/lib/api";
import { space } from "@/theme";

/** Events members can come to, soonest first, as on /members/events. */
export default function EventsTab() {
  const q = useQuery({ queryKey: eventsKey, queryFn: () => api<EventsResponse>("events") });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const { events, going, next } = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <View style={{ gap: space.sm }}>
        <Title>Coming up</Title>
        <Muted>
          {going > 0
            ? `You're going to ${going} ${going === 1 ? "event" : "events"}. Everything members can come to is below.`
            : "Gatherings, masterclasses, case rounds and chapter meetups. Let us know you're coming so we can plan."}
        </Muted>
      </View>
      {events.length === 0 ? (
        <Empty
          title="Nothing is scheduled just now."
          body={`The next gathering is in ${next.city} (${next.status.toLowerCase()}). It will appear here, with masterclasses and chapter meetups, as soon as it's announced.`}
        />
      ) : (
        events.map((e) => <EventCard key={e.id} event={e} />)
      )}
    </Screen>
  );
}
