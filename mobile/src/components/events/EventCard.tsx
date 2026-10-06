import { View } from "react-native";
import { router } from "expo-router";
import { MapPin, Video } from "lucide-react-native";
import { Heading, PressableCard, Small, Text } from "@/components/ui";
import { colors, space } from "@/theme";
import { AttendeeFaces } from "./AttendeeFaces";
import { BookingActions } from "./BookingActions";
import { DateBlock } from "./DateBlock";
import { EventBadges } from "./EventBadges";
import type { EventListItem } from "./types";

/** An event in the list. Tapping anywhere opens it; the booking button works in place. */
export function EventCard({ event }: { event: EventListItem }) {
  const PlaceIcon = event.online ? Video : MapPin;
  const meta = [event.time, event.price, event.left != null && event.left > 0 ? `${event.left} ${event.left === 1 ? "place" : "places"} left` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <PressableCard
      onPress={() => router.push(`/events/${event.slug}`)}
      accessibilityLabel={`${event.title}, ${event.day.weekday} ${event.day.day} ${event.day.month}`}
      style={{ flexDirection: "row", gap: space.lg }}>
      <DateBlock day={event.day} />
      <View style={{ flex: 1, gap: space.sm }}>
        <EventBadges event={event} />
        <Heading>{event.title}</Heading>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PlaceIcon size={14} color={colors.muted} strokeWidth={1.75} />
            <Small style={{ flex: 1 }}>{event.place}</Small>
          </View>
          <Small>{meta}</Small>
        </View>
        <Text numberOfLines={2}>{event.summary}</Text>
        <AttendeeFaces attendees={event.attendees} text={event.goingText} />
        <View style={{ marginTop: space.xs }}>
          <BookingActions event={event} />
        </View>
      </View>
    </PressableCard>
  );
}
