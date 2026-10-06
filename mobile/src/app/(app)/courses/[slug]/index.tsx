import { Pressable, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Award, Check, ChevronRight, Clock, FileCheck, Lock, NotebookPen, ShieldCheck } from "lucide-react-native";
import { Badge, Button, Card, ErrorState, Heading, Label, Loading, Muted, Screen, Small, Text, Title } from "@/components/ui";
import { ProgressRing } from "@/components/courses/ProgressRing";
import { longDate, type CourseDetail } from "@/components/courses/types";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/theme";

export default function CourseScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["courses", "detail", slug], queryFn: () => api<CourseDetail>(`courses/${slug}`) });

  if (query.isLoading) return <Loading />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: data.access === "active" ? "Your course" : "Course" }} />
      {data.access === "active" ? <Learner data={data} /> : <Outline data={data} />}
    </Screen>
  );
}

/** For anyone without a place: what the course covers, and how to get a place. */
function Outline({ data }: { data: CourseDetail }) {
  const { course } = data;
  const qc = useQueryClient();
  const free = course.yourPrice.amountPence === 0;
  const enrol = useMutation({
    mutationFn: () => api(`courses/${course.slug}/enrol`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });

  return (
    <>
      <Image source={{ uri: course.image }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.xl, backgroundColor: colors.paper2 }} contentFit="cover" />
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Badge label={`${course.hours} hours`} />
        <Badge label="Online" />
        {course.status === "coming-soon" ? <Badge label="Opening soon" /> : <Badge label="Open now" tone="positive" />}
      </View>
      <Title>{course.title}</Title>
      <Text style={{ fontSize: 17, lineHeight: 25 }}>{course.summary}</Text>
      {course.reviewer && (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <ShieldCheck size={16} color={colors.ink2} strokeWidth={1.75} style={{ marginTop: 2 }} />
          <Small style={{ flex: 1 }}>
            Reviewed by {course.reviewer.name}, {course.reviewer.credentials}.
          </Small>
        </View>
      )}

      <Card style={{ gap: space.md }}>
        {data.access === "pending" ? (
          <>
            <Heading>We're confirming your payment.</Heading>
            <Muted>This usually takes a few seconds. Pull down to refresh, and your place on this course will be ready as soon as the payment is confirmed.</Muted>
          </>
        ) : course.status === "coming-soon" ? (
          <>
            <Heading>This course opens soon.</Heading>
            <Muted>Every lesson, the knowledge checks and the final assessment will be here in the app as soon as you have a place.</Muted>
          </>
        ) : free ? (
          <>
            <Heading>Your place on this course is free.</Heading>
            <Muted>Take your place to open every lesson, keep your notes and reflections, and earn a certificate for your CPD record.</Muted>
            {enrol.error && <Small style={{ color: colors.destructive }}>{enrol.error instanceof ApiError ? enrol.error.message : "Something went wrong. Please try again."}</Small>}
            <Button title="Take my place" loading={enrol.isPending} onPress={() => enrol.mutate()} />
          </>
        ) : (
          <>
            <Heading>Places on this course are available on trichollective.net.</Heading>
            <Muted>Once you have a place, every lesson, your notes and the final assessment are here in the app, and your progress follows you between the app and the website.</Muted>
          </>
        )}
      </Card>

      <View style={{ gap: space.md }}>
        <Label>What you'll be able to do</Label>
        {course.outcomes.map((o) => (
          <View key={o} style={{ flexDirection: "row", gap: space.md }}>
            <Check size={16} color={colors.ink} strokeWidth={2} style={{ marginTop: 4 }} />
            <Text style={{ flex: 1, color: colors.ink, fontSize: 16, lineHeight: 24 }}>{o}.</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space.md }}>
        <Label>What the course covers</Label>
        <Small>{course.format}.</Small>
        <Card style={{ padding: 0 }}>
          {course.syllabus.map((s, i) => (
            <View key={s.title} style={[styles.row, i > 0 && styles.divider]}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{s.title}</Text>
                <Small style={{ color: colors.ink2 }}>{s.detail}</Small>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </>
  );
}

/** For a learner with a place: progress, the lessons and the assessment, as on /members/courses/[slug]. */
function Learner({ data }: { data: CourseDetail }) {
  const { course } = data;
  const progress = data.progress!;
  const lessons = data.lessons ?? [];
  const assessment = data.assessment!;
  const certificate = data.certificate;
  const nextLesson = lessons.find((l) => l.slug === progress.next);
  const allDone = progress.total > 0 && progress.done === progress.total;
  const base = `/courses/${course.slug}`;

  return (
    <>
      {data.preview && (
        <Card style={{ backgroundColor: colors.paper2 }}>
          <Text>You're viewing this course as a member of the team, so your answers and notes aren't saved.</Text>
        </Card>
      )}
      <Label>Your course</Label>
      <Title>{course.title}</Title>
      <Text style={{ fontSize: 16, lineHeight: 24 }}>{course.summary}</Text>

      {certificate ? (
        <Button title="Your certificate" icon={Award} full onPress={() => router.push(`${base}/certificate`)} />
      ) : nextLesson ? (
        <Button title={progress.done === 0 ? "Start the course" : "Continue"} full onPress={() => router.push(`${base}/${nextLesson.slug}`)} />
      ) : allDone ? (
        <Button title="Take the assessment" full onPress={() => router.push(`${base}/assessment`)} />
      ) : null}

      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
        <ProgressRing percent={certificate ? 100 : Math.round((progress.done / (progress.total + 1)) * 100)} size={76} />
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", rowGap: space.md }}>
          <Stat label="Lessons" value={`${progress.done} of ${progress.total}`} />
          <Stat label="Study time" value={`About ${course.hours} hours`} />
          <Stat label="Reflections" value={`${data.reflections ?? 0} written`} />
          <Stat
            label="Assessment"
            value={certificate ? "Passed" : assessment.best != null ? `Best ${assessment.best} of ${assessment.questions}` : allDone ? "Ready" : "Locked"}
            detail={`Pass mark ${Math.round(assessment.passMark * 100)}%`}
          />
        </View>
      </Card>

      <View style={{ gap: space.md }}>
        <Label>Lessons</Label>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {lessons.map((lesson, i) => {
            const current = lesson.slug === progress.next;
            return (
              <Pressable
                key={lesson.slug}
                accessibilityRole="button"
                accessibilityHint={lesson.done ? "Completed" : current ? "Up next" : "Not started"}
                onPress={() => router.push(`${base}/${lesson.slug}`)}
                style={({ pressed }) => [styles.row, i > 0 && styles.divider, current && { backgroundColor: colors.paper2 }, pressed && { backgroundColor: colors.paper3 }]}>
                <View style={[styles.number, lesson.done && styles.numberDone, current && !lesson.done && { borderColor: colors.ink }]}>
                  {lesson.done ? <Check size={15} color={colors.onInk} strokeWidth={2.25} /> : <Text style={styles.numberText}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{lesson.title}</Text>
                  <Small style={{ color: colors.ink2 }} numberOfLines={2}>
                    {lesson.detail}
                  </Small>
                  <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
                    <Meta icon={Clock} text={`${lesson.minutes} min`} />
                    {lesson.done && lesson.checkScore != null && <Small>Check {lesson.checkScore}/{lesson.checkTotal}</Small>}
                    {lesson.reflected && <Meta icon={NotebookPen} text="Reflected" />}
                  </View>
                </View>
                <ChevronRight size={18} color={colors.mute} strokeWidth={1.75} />
              </Pressable>
            );
          })}
          {assessment.open ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`${base}/assessment`)}
              style={({ pressed }) => [styles.row, styles.divider, pressed && { backgroundColor: colors.paper3 }]}>
              <View style={[styles.number, certificate ? styles.numberDone : { borderColor: colors.ink }]}>
                {certificate ? <Check size={15} color={colors.onInk} strokeWidth={2.25} /> : <FileCheck size={15} color={colors.ink} strokeWidth={1.75} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>Final assessment</Text>
                <Small style={{ color: colors.ink2 }}>
                  {assessment.questions} questions. Score {Math.round(assessment.passMark * 100)}% or more to earn your certificate.
                </Small>
              </View>
              <ChevronRight size={18} color={colors.mute} strokeWidth={1.75} />
            </Pressable>
          ) : (
            <View style={[styles.row, styles.divider]}>
              <View style={styles.number}>
                <Lock size={15} color={colors.muted} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>Final assessment</Text>
                <Small>Opens when you've completed every lesson.</Small>
              </View>
            </View>
          )}
        </Card>
      </View>

      <Card style={{ gap: space.sm }}>
        <Label>What you'll be able to do</Label>
        {course.outcomes.map((o) => (
          <View key={o} style={{ flexDirection: "row", gap: space.md }}>
            <Check size={15} color={colors.ink} strokeWidth={2} style={{ marginTop: 4 }} />
            <Text style={{ flex: 1 }}>{o}.</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: space.sm }}>
        <Label>Your record</Label>
        {certificate ? (
          <>
            <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>Completed on {longDate(certificate.issuedAt)}</Text>
            <Text>
              Certificate {certificate.id}, {certificate.hours} hours of study. Your reflections are on the certificate page, ready for your CPD log.
            </Text>
          </>
        ) : (
          <Text>
            Your knowledge check scores, notes and reflections are kept here as you go. When you pass the assessment they become a CPD record alongside your certificate.
          </Text>
        )}
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: space.xs }}>
          <Badge label={`${course.hours} hours CPD`} />
          {data.activatedAt && <Badge label={`Enrolled ${longDate(data.activatedAt)}`} />}
        </View>
      </Card>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={{ width: "50%", gap: 1, paddingRight: space.sm }}>
      <Small>{label}</Small>
      <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink, fontSize: 14 }}>{value}</Text>
      {detail && <Small style={{ fontSize: 11 }}>{detail}</Small>}
    </View>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon size={13} color={colors.muted} strokeWidth={1.75} />
      <Small>{text}</Small>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  number: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.rule, alignItems: "center", justifyContent: "center" },
  numberDone: { backgroundColor: colors.positive, borderColor: colors.positive },
  numberText: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.ink },
});
