import { useState } from "react";
import { Linking, Pressable, Share, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { CalendarDays, CalendarPlus, Clock, MapPin, Megaphone, Share2, Users, Video } from "lucide-react-native";
import { Avatar, Button, Card, Display, ErrorState, Heading, Loading, Muted, Rule, Screen, Small, Text } from "@/components/ui";
import { BookingActions } from "@/components/events/BookingActions";
import { EventBadges } from "@/components/events/EventBadges";
import { eventKey, eventsKey, type EventDetail } from "@/components/events/types";
import { api } from "@/lib/api";
import { openHref } from "@/lib/push";
import { colors, space } from "@/theme";

function Row({ icon: Icon, children }: { icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <Icon size={17} color={colors.ink} strokeWidth={1.75} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>{children}</View>
    </View>
  );
}

/** One event: when and where, booking, the joining link and calendar for members who are going, and who else is coming. */
export default function EventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: eventKey(slug), queryFn: () => api<{ event: EventDetail }>(`events/${slug}`) });
  const [returned, setReturned] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const share = useMutation({
    mutationFn: () => api<{ ok: boolean; redirect?: string }>(`events/${slug}/share`, { method: "POST" }),
    onMutate: () => setShareError(null),
    onSuccess: ({ redirect }) => {
      if (!redirect || redirect.includes("shared=no")) {
        setShareError("This couldn't be shared just now. Please make sure you are going and can post in The Lounge.");
        return;
      }
      qc.invalidateQueries({ queryKey: ["community"] });
      openHref(redirect);
    },
    onError: (e) => setShareError(e instanceof Error ? e.message : "This couldn't be shared just now."),
  });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const e = q.data.event;

  const refetchAll = () => {
    q.refetch();
    qc.invalidateQueries({ queryKey: eventsKey });
  };

  return (
    <Screen refreshing={q.isRefetching} onRefresh={refetchAll}>
      <Stack.Screen
        options={{
          title: e.kindLabel,
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Share this event" hitSlop={10} onPress={() => Share.share({ message: `${e.title}\n${e.url}` })}>
              <Share2 size={20} color={colors.ink} strokeWidth={1.75} />
            </Pressable>
          ),
        }}
      />

      {returned && !e.hasTicket && (
        <Card style={{ backgroundColor: colors.paper2 }}>
          <Text>
            If you completed your payment, it is being confirmed now, and your ticket and calendar link will arrive by email within a few minutes. Pull down to refresh this page.
          </Text>
        </Card>
      )}

      <View style={{ gap: space.md }}>
        <EventBadges event={e} showPast />
        <Display>{e.title}</Display>
        <Text style={{ fontSize: 16, lineHeight: 24 }}>{e.summary}</Text>
      </View>

      <Card style={{ gap: space.lg }}>
        <Row icon={CalendarDays}>
          <Text style={{ color: colors.ink }}>{e.date}</Text>
        </Row>
        <Row icon={Clock}>
          <Text style={{ color: colors.ink }}>{e.timeLong}</Text>
        </Row>
        <Row icon={e.online ? Video : MapPin}>
          <Text style={{ color: colors.ink }}>{e.place}</Text>
          {e.online && !e.joinUrl && <Small>The joining link appears here and in your confirmation email once you say you are going.</Small>}
        </Row>
        <Row icon={Users}>
          <Text style={{ color: colors.ink }}>
            {e.price}
            {e.left != null && e.left > 0 && !e.past ? `. ${e.left} ${e.left === 1 ? "place" : "places"} left.` : "."}
          </Text>
        </Row>

        {!e.past && (
          <>
            <Rule />
            <BookingActions event={e} onCheckoutClosed={() => setReturned(true)} />
            {e.hasTicket && <Text>Your ticket is confirmed, and the details have been sent to your email.</Text>}
            {e.attending && (
              <View style={{ gap: space.lg }}>
                {e.joinUrl && (
                  <Button title="Join on Google Meet" icon={Video} onPress={() => Linking.openURL(e.joinUrl!)} />
                )}
                {e.calendar && (
                  <View style={{ gap: space.sm }}>
                    <Text style={{ color: colors.ink }}>{"Add it to your calendar so you don't miss it."}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                      <Button title="Google Calendar" icon={CalendarPlus} variant="secondary" size="sm" onPress={() => WebBrowser.openBrowserAsync(e.calendar!.google)} />
                      <Button title="Apple or Outlook" icon={CalendarPlus} variant="secondary" size="sm" onPress={() => Linking.openURL(e.calendar!.ics)} />
                    </View>
                  </View>
                )}
                <View style={{ gap: space.sm }}>
                  <Text style={{ color: colors.ink }}>Let colleagues know you are going, so they can join you.</Text>
                  <Button
                    title="Tell the community you're going"
                    icon={Megaphone}
                    variant="secondary"
                    loading={share.isPending}
                    onPress={() => share.mutate()}
                  />
                  {shareError && <Small style={{ color: colors.destructive }}>{shareError}</Small>}
                </View>
              </View>
            )}
          </>
        )}
      </Card>

      <View style={{ gap: space.md }}>
        {e.paragraphs.length > 0 ? (
          e.paragraphs.map((p, i) => (
            <Text key={i} style={{ fontSize: 16, lineHeight: 26 }}>
              {p}
            </Text>
          ))
        ) : (
          <Text style={{ fontSize: 16, lineHeight: 26 }}>The full programme will be shared here and sent to everyone who books.</Text>
        )}
      </View>

      <Card style={{ gap: space.md }}>
        <View style={{ gap: 4 }}>
          <Heading>{e.past ? "Who went" : "Who's going"}</Heading>
          <Muted>{e.goingText}</Muted>
        </View>
        {e.attendees.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={() => router.push(`/people/${a.id}`)}
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 4 }, pressed && { opacity: 0.6 }]}>
            <Avatar name={a.name} image={a.image} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink }} numberOfLines={1}>
                {a.name || "Member"}
                {a.you && <Text style={{ color: colors.muted }}> (you)</Text>}
              </Text>
              <Small>{a.profession}</Small>
            </View>
          </Pressable>
        ))}
      </Card>

      {e.chapter && (
        <Button title={`See the ${e.chapter.city} chapter`} variant="ghost" onPress={() => openHref(`/members/chapters/${e.chapter!.slug}`)} />
      )}
    </Screen>
  );
}
