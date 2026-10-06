import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, MapPin } from "lucide-react-native";
import { Badge, Button, Card, Display, Empty, ErrorState, Heading, Label, Loading, Muted, Screen, Section, Small, Text } from "@/components/ui";
import { ComposePrompt } from "@/components/community/ComposePrompt";
import { EventRow, PersonRow } from "@/components/community/Mini";
import { PostCard } from "@/components/community/PostCard";
import { greeting, monthYear, mutedNotice, professionLabel } from "@/components/community/format";
import { openPath } from "@/components/community/links";
import type { HomeResponse } from "@/components/community/types";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useOnboardingRedirect } from "@/components/onboarding/useOnboardingRedirect";
import { colors, fonts, radius, space } from "@/theme";

/** Today: getting started, the latest from the collective, what's coming up and people nearby. */
export default function HomeTab() {
  const { data: me } = useMe();
  useOnboardingRedirect();
  const q = useQuery({ queryKey: ["home"], queryFn: () => api<HomeResponse>("home") });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const home = q.data;

  if (!home.member) {
    return (
      <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
        <Label>Free account</Label>
        <Display>{`Welcome, ${home.name || "there"}. Your free account is ready.`}</Display>
        <Muted>
          You can be found in the founding directory and read Trichozette today. Membership adds the Case Room, peer review, CPD and the
          referral network whenever you are ready.
        </Muted>
        <Card style={{ gap: space.md }}>
          <Heading>Join colleagues across every discipline of hair and scalp care.</Heading>
          <Muted>Members ask questions in every space, learn at a live masterclass each month and pay less for courses and conferences.</Muted>
          <Button title="See membership" onPress={() => router.push("/membership")} />
        </Card>
      </Screen>
    );
  }

  const { user, checklist, feed, events, gazette, people, name } = home;
  const remaining = checklist.filter((c) => !c.done).length;
  const profession = professionLabel(user.profession);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <View style={{ gap: space.md }}>
        <Label>Today</Label>
        <Display>{`${greeting()}${name ? `, ${name}` : ""}`}</Display>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {user.isFounding && <Badge label="Founding member" tone="ink" />}
          {profession && <Badge label={profession} />}
          {user.chapter && (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/chapters/${user.chapter!.slug}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.paper2, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
              <MapPin size={12} color={colors.ink2} strokeWidth={1.75} />
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink2 }}>{user.chapter.city} chapter</Text>
            </Pressable>
          )}
        </View>
      </View>

      {remaining > 0 && (
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Label>Getting started</Label>
            <Small>
              {checklist.length - remaining} of {checklist.length} done
            </Small>
          </View>
          <Text>These few steps help colleagues find you, trust your work and refer clients to you.</Text>
          <View>
            {checklist.map((c) => (
              <Pressable
                key={c.label}
                accessibilityRole="button"
                accessibilityState={{ checked: c.done }}
                onPress={() => openPath(c.href)}
                style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.md, opacity: pressed ? 0.7 : 1 })}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.done ? colors.ink : colors.rule,
                    backgroundColor: c.done ? colors.ink : colors.paper,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {c.done && <Check size={14} color={colors.onInk} strokeWidth={2} />}
                </View>
                <Text style={{ flex: 1, color: c.done ? colors.muted : colors.ink, textDecorationLine: c.done ? "line-through" : "none" }}>{c.label}</Text>
                {!c.done && <ArrowRight size={16} color={colors.muted} strokeWidth={1.75} />}
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <ComposePrompt
        label={name ? `Share something with the collective, ${name}.` : "Share something with the collective."}
        notice={me?.access.muted ? mutedNotice(me.access.muted) : null}
      />

      {user.chapter && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`/chapters/${user.chapter!.slug}`)}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            borderRadius: radius.lg,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.85 : 1,
          })}>
          <View style={{ gap: 6 }}>
            <Label style={{ color: colors.onInk, opacity: 0.6 }}>Your chapter</Label>
            <Display style={{ color: colors.onInk, fontSize: 28, lineHeight: 30 }}>{user.chapter.city}</Display>
          </View>
          <ArrowRight size={20} color={colors.onInk} strokeWidth={1.75} />
        </Pressable>
      )}

      <Section title="Latest from the collective">
        {feed.length === 0 ? (
          <Empty
            title="It's quiet here for now."
            body="The community is just getting started. Introduce yourself, or ask the question you've been meaning to ask."
            action={{ title: "Go to Introductions", onPress: () => router.push("/community?space=introductions") }}
          />
        ) : (
          feed.map((post) => <PostCard key={post.id} post={post} />)
        )}
        {feed.length > 0 && <Button title="See all spaces" variant="secondary" full onPress={() => router.push("/community")} />}
      </Section>

      <Card style={{ gap: space.sm }}>
        <Label>Coming up</Label>
        {events.length === 0 ? (
          <Small>No events are scheduled just now. The next gathering will appear here as soon as it's announced.</Small>
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </Card>

      <Card style={{ gap: space.sm }}>
        <Label>{gazette?.publishedAt ? `Trichozette, ${monthYear(gazette.publishedAt)}` : "Trichozette"}</Label>
        {gazette ? (
          <Pressable accessibilityRole="link" onPress={() => openPath(`/members/trichozette/${gazette.id}`)} style={{ gap: 6 }}>
            <Heading>{gazette.title}</Heading>
            {gazette.summary ? <Text numberOfLines={3}>{gazette.summary}</Text> : null}
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>Read the article</Text>
          </Pressable>
        ) : (
          <Small>The first edition is being prepared.</Small>
        )}
      </Card>

      {user.chapter && (
        <Card style={{ gap: space.sm }}>
          <Label>People to meet</Label>
          {people.length === 0 ? (
            <Small>{`You're following everyone in ${user.chapter.city} so far. New members will appear here.`}</Small>
          ) : (
            people.map((p) => <PersonRow key={p.id} person={p} />)
          )}
        </Card>
      )}
    </Screen>
  );
}
