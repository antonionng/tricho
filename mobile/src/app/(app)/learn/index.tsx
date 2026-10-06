import { View } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ChevronRight, Newspaper, Sparkles } from "lucide-react-native";
import { Badge, Empty, ErrorState, Heading, Label, Loading, Muted, PressableCard, Screen, Small, Text, Title } from "@/components/ui";
import { CourseCard } from "@/components/learn/CourseCard";
import { LinkCard } from "@/components/learn/LinkCard";
import { learnKey, type LearnHub } from "@/components/learn/types";
import { api } from "@/lib/api";
import { colors, fonts, space } from "@/theme";

/** Learn: your courses and CPD, the course catalogue and the library, as on /members/learn. */
export default function LearnScreen() {
  const q = useQuery({ queryKey: learnKey, queryFn: () => api<LearnHub>("learn") });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const d = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Learn" }} />
      <View style={{ gap: space.sm }}>
        <Title>Learn</Title>
        <Muted>Short, careful pieces you can use this week, and courses written with practitioners from each discipline.</Muted>
      </View>

      {d.member && (
        <View style={{ gap: space.md }}>
          <LinkCard
            icon={Newspaper}
            title="Trichozette"
            body="Read the monthly edition on research, practice and news from across the collective."
            onPress={() => router.push("/trichozette")}
          />
          {d.professional && (
            <LinkCard
              icon={Sparkles}
              title="Assistant"
              body="Ask a question about hair and scalp practice and get a careful, considered answer straight away."
              onPress={() => router.push("/assistant")}
            />
          )}
        </View>
      )}

      {d.mine.length > 0 && (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Label>Your courses</Label>
            {d.cpdHours > 0 && <Small>{d.cpdHours} hours of CPD completed</Small>}
          </View>
          {d.mine.map((m) => (
            <PressableCard
              key={m.id}
              accessibilityLabel={`${m.title}. ${m.status}`}
              onPress={() => router.push(m.certificate ? `/courses/${m.slug}/certificate` : `/courses/${m.slug}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: m.certificate ? colors.ink : colors.paper2,
                }}>
                {m.certificate ? (
                  <Award size={24} color={colors.onInk} strokeWidth={1.5} />
                ) : (
                  <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.ink }}>{m.percent}%</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Heading>{m.title}</Heading>
                <Small>{m.status}</Small>
              </View>
              <ChevronRight size={18} color={colors.mute} />
            </PressableCard>
          ))}
        </View>
      )}

      <View style={{ gap: space.md }}>
        <Label>Courses</Label>
        {d.courses.map((c) => (
          <CourseCard key={c.slug} course={c} />
        ))}
      </View>

      {d.member && (
        <View style={{ gap: space.md }}>
          <Label>The library</Label>
          {d.library.length === 0 ? (
            <Empty
              title="The library is being written."
              body="Pieces are reviewed by a practitioner before they appear here. The first few are on their way."
            />
          ) : (
            d.library.map((p) => (
              <PressableCard key={p.id} onPress={() => router.push(`/learn/${p.id}`)} accessibilityLabel={p.title} style={{ gap: space.sm }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <Badge label={p.audience} />
                  <Badge label={p.kind.charAt(0).toUpperCase() + p.kind.slice(1)} />
                </View>
                <Heading>{p.title}</Heading>
                <Text numberOfLines={3}>{p.summary}</Text>
              </PressableCard>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}
