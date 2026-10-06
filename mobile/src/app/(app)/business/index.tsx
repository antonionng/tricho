import { Pressable, View } from "react-native";
import { router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { ArrowUpRight, BadgeCheck, Briefcase, Check, ChevronRight, Circle, Users } from "lucide-react-native";
import { Badge, Button, Card, Empty, ErrorState, Loading, Muted, Rule, Screen, Section, Small, Text, Title } from "@/components/ui";
import { BusinessResults } from "@/components/business/Results";
import { openWeb } from "@/components/business/openWeb";
import type { BusinessDashboard } from "@/components/business/types";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { colors, fonts, space } from "@/theme";

const businessKey = ["business", "dashboard"] as const;

function Row({ icon: Icon, title, detail, onPress }: { icon: typeof Users; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }, pressed && { backgroundColor: colors.paper2 }]}>
      <Icon size={20} color={colors.ink} strokeWidth={1.75} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.sansMedium }}>{title}</Text>
        <Small>{detail}</Small>
      </View>
      <ChevronRight size={18} color={colors.mute} />
    </Pressable>
  );
}

/** The business portal on a phone: how the page is doing, the team's seats and open roles. */
export default function BusinessScreen() {
  const q = useQuery({ queryKey: businessKey, queryFn: () => api<BusinessDashboard>("business") });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const d = q.data;

  if (!d.page) {
    return (
      <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
        <Stack.Screen options={{ title: "Your business" }} />
        {d.business ? (
          <Empty
            title="Your Business plan is active, so you can set up your page."
            body="The guided setup takes you through your brand details, logo, story, photos and perk. It works best on a larger screen, so it opens on the website."
            action={{ title: "Start the setup", onPress: () => openWeb(d.web.setup) }}
          />
        ) : (
          <Empty
            title="Put your business in front of hair and scalp professionals."
            body="The Business plan gives you a full page in the directory in your own colours, with your story, products and photos, plus a perk for members and Professional membership for five of your team. You can find out more on the Trichollective website."
          />
        )}
      </Screen>
    );
  }

  const { page, setup, results, seats, jobs, web } = d;
  const logo = mediaUrl(page.logo);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Your business" }} />

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        {logo && <Image source={logo} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.card }} contentFit="contain" />}
        <Title style={{ flex: 1 }}>{page.name}</Title>
      </View>
      <Muted>Your page appears in the partner directory, and your perk is shown to every member. Changes go live as soon as you save.</Muted>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {page.hidden ? <Badge label="Paused by Trichollective" /> : page.published ? <Badge label="Live" tone="positive" /> : <Badge label="Hidden" />}
        <Badge label={page.tierLabel} />
        {page.isFounding && <Badge label="Founding partner" tone="ink" />}
      </View>
      {web.page && <Button title="View your page" variant="secondary" size="sm" icon={ArrowUpRight} onPress={() => openWeb(web.page!)} />}

      {!d.business && (
        <Card>
          <Text style={{ color: colors.destructive }}>
            Your page, seats and job posts work while your Business or Premium Business plan is active. Reply to any of our emails and we will help.
          </Text>
        </Card>
      )}

      <Section title="Your results">
        <BusinessResults results={results} published={page.published} hasPerk={page.hasPerk} onAddPerk={() => openWeb(web.perk)} />
      </Section>

      <Section title="Your team and roles">
        <Card style={{ padding: 0 }}>
          <Row
            icon={Users}
            title="Team seats"
            detail={`${seats.used} of ${seats.limit} Professional seats used`}
            onPress={() => router.push("/business/team")}
          />
          <Rule style={{ marginLeft: 50 }} />
          <Row
            icon={Briefcase}
            title="Job posts"
            detail={jobs.open ? `${jobs.open} ${jobs.open === 1 ? "role is" : "roles are"} open on the jobs board` : "Post roles to hair and scalp professionals"}
            onPress={() => router.push("/business/jobs")}
          />
        </Card>
      </Section>

      <Section title={setup.stepsLeft ? `Your profile: ${setup.stepsLeft} of ${setup.total} steps left` : "Your profile is complete"}>
        <Card style={{ gap: space.md }}>
          {setup.next && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink }}>{setup.next.sentence}</Text>}
          <Muted style={{ fontSize: 14 }}>
            {setup.stepsLeft
              ? "A complete profile helps professionals understand what you offer. Your logo, story, photos and the rest of your page are edited on the website, where there is room to see your page as you build it."
              : "Everything is in place. You can change any part of your page on the website."}
          </Muted>
          <View style={{ gap: 6 }}>
            {setup.steps.map((st) => (
              <View key={st.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {st.done ? (
                  <Check size={16} color={colors.positive} strokeWidth={2} accessibilityLabel="Done" />
                ) : (
                  <Circle size={16} color={colors.mute} strokeWidth={1.75} accessibilityLabel="To do" />
                )}
                <Text style={{ color: st.done ? colors.ink2 : colors.ink, fontSize: 14 }}>{st.label}</Text>
              </View>
            ))}
          </View>
          <Button
            title={setup.next ? `${setup.next.button} on the website` : "Edit your page on the website"}
            icon={ArrowUpRight}
            full
            onPress={() => openWeb(setup.next ? web.setup : web.portal)}
          />
        </Card>
      </Section>

      {d.premium && (
        <Section title="Your plan">
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <BadgeCheck size={20} color={colors.ink} strokeWidth={1.75} />
              <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.ink }}>Premium partner</Text>
            </View>
            <Muted style={{ fontSize: 14 }}>
              {page.isFounding
                ? "You are one of our founding Premium partners, and your plan includes the following throughout the year."
                : "Your Premium Business plan includes the following throughout the year."}
            </Muted>
            {d.premium.includes.map((line) => (
              <View key={line} style={{ flexDirection: "row", gap: 10 }}>
                <Check size={16} color={colors.positive} strokeWidth={2} style={{ marginTop: 3 }} />
                <Text style={{ flex: 1, fontSize: 14, color: colors.ink }}>{line}</Text>
              </View>
            ))}
            <Small>
              To plan your masterclass, Trichozette feature, newsletter spotlights or conference slot, reply to any email from our team and we will arrange
              the dates with you.
            </Small>
          </Card>
        </Section>
      )}
    </Screen>
  );
}
