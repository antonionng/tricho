import { View } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Award, ChevronRight } from "lucide-react-native";
import { Badge, ErrorState, Heading, Label, Loading, Muted, PressableCard, Screen, Small, Text } from "@/components/ui";
import { ProgressRing } from "@/components/courses/ProgressRing";
import type { CourseList, CourseListItem } from "@/components/courses/types";
import { api } from "@/lib/api";
import { colors, radius, space } from "@/theme";

export default function CoursesScreen() {
  const query = useQuery({ queryKey: ["courses", "list"], queryFn: () => api<CourseList>("courses") });
  const data = query.data;

  if (query.isLoading) return <Loading />;
  if (query.error || !data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const mine = data.mine.map((slug) => data.courses.find((c) => c.slug === slug)!).filter(Boolean);

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: "Courses" }} />
      <Muted>Courses written with practitioners from each discipline. Pass the final assessment to earn a certificate for your CPD record.</Muted>

      {mine.length > 0 && (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Label>Your courses</Label>
            {data.cpdHours > 0 && <Small>{data.cpdHours} hours of CPD completed</Small>}
          </View>
          {mine.map((c) => (
            <MyCourse key={c.slug} course={c} />
          ))}
        </View>
      )}

      <View style={{ gap: space.md }}>
        <Label>All courses</Label>
        {data.courses.map((c) => (
          <PressableCard key={c.slug} onPress={() => router.push(`/courses/${c.slug}`)} style={{ padding: 0, overflow: "hidden" }}>
            <Image source={{ uri: c.image }} style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.paper2 }} contentFit="cover" transition={150} />
            <View style={{ padding: space.lg, gap: space.sm }}>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {c.enrolment ? (
                  <Badge label="Enrolled" tone="ink" />
                ) : c.status === "coming-soon" ? (
                  <Badge label="Opening soon" />
                ) : (
                  <Badge label="Open" tone="positive" />
                )}
                <Badge label={`${c.hours} hours CPD`} />
              </View>
              <Heading>{c.title}</Heading>
              <Text numberOfLines={3}>{c.summary}</Text>
              <Small>For {c.audience.charAt(0).toLowerCase() + c.audience.slice(1)}.</Small>
            </View>
          </PressableCard>
        ))}
      </View>
    </Screen>
  );
}

function MyCourse({ course }: { course: CourseListItem }) {
  const e = course.enrolment!;
  const certificate = e.certificate;
  return (
    <PressableCard
      onPress={() => router.push(certificate ? `/courses/${course.slug}/certificate` : `/courses/${course.slug}`)}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      {certificate ? (
        <View style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
          <Award size={24} color={colors.onInk} strokeWidth={1.4} />
        </View>
      ) : (
        <ProgressRing percent={e.percent} size={56} />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Heading style={{ fontSize: 16 }}>{course.title}</Heading>
        <Small>
          {certificate
            ? `Completed. Certificate ${certificate.id}, ${certificate.hours} hours CPD.`
            : e.done === e.total
              ? "Every lesson done. The final assessment is ready for you."
              : `${e.done} of ${e.total} lessons complete.`}
        </Small>
      </View>
      <ChevronRight size={18} color={colors.mute} strokeWidth={1.75} />
    </PressableCard>
  );
}
