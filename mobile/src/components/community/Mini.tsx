import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Avatar, Small, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import { eventWhen, professionLabel } from "./format";
import { openPath } from "./links";
import type { MiniEvent, MiniMember } from "./types";

/** An upcoming event in a short list. */
export function EventRow({ event }: { event: MiniEvent }) {
  const d = new Date(event.startsAt);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPath(`/members/events/${event.slug}`)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 46, alignItems: "center", paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.paper2 }}>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 17, color: colors.ink }}>{d.getDate()}</Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>{d.toLocaleDateString("en-GB", { month: "short" })}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>
          {event.title}
        </Text>
        <Small>{[eventWhen(event.startsAt), event.online ? "Online" : event.city, event.going ? "You're going" : null].filter(Boolean).join(" · ")}</Small>
      </View>
    </Pressable>
  );
}

/** A member in a short list, opening their profile. */
export function PersonRow({ person }: { person: MiniMember }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/people/${person.id}`)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}>
      <Avatar name={person.name} image={person.image} size={36} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>
          {person.name || "Member"}
        </Text>
        <Small>{professionLabel(person.profession) ?? "Member"}</Small>
      </View>
    </Pressable>
  );
}
