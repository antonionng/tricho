import { View } from "react-native";
import { Badge } from "@/components/ui";
import type { EventSummary } from "./types";

/** The kind, "Your chapter" and whether the member is going, as on the website. */
export function EventBadges({ event, showPast }: { event: EventSummary; showPast?: boolean }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      <Badge label={event.kindLabel} />
      {event.local && <Badge label="Your chapter" tone="ink" />}
      {event.hasTicket ? <Badge label="You have a ticket" tone="positive" /> : event.going ? <Badge label="You're going" tone="positive" /> : null}
      {showPast && event.past && <Badge label="This event has taken place" />}
    </View>
  );
}
