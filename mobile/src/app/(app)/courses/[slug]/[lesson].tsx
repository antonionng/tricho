import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Lock, RotateCcw, Target } from "lucide-react-native";
import { Button, Card, ErrorState, Heading, Input, Label, Loading, Muted, Screen, Small, Text, Title } from "@/components/ui";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { QuestionOptions } from "@/components/courses/Options";
import type { CheckResult, LessonData } from "@/components/courses/types";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/theme";

export default function LessonScreen() {
  const { slug, lesson } = useLocalSearchParams<{ slug: string; lesson: string }>();
  const query = useQuery({
    queryKey: ["courses", "lesson", slug, lesson],
    queryFn: () => api<LessonData>(`courses/${slug}/lessons/${lesson}`),
  });

  if (query.isLoading) return <Loading />;
  if (query.error || !query.data) {
    if (query.error instanceof ApiError && query.error.status === 403) {
      return (
        <Screen>
          <Stack.Screen options={{ title: "Lesson" }} />
          <Heading>You need a place on this course to open its lessons.</Heading>
          <Button title="See the course" onPress={() => router.replace(`/courses/${slug}`)} />
        </Screen>
      );
    }
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  return <Lesson key={`${slug}/${lesson}`} slug={slug} data={query.data} />;
}

function Lesson({ slug, data }: { slug: string; data: LessonData }) {
  const { lesson } = data;
  const base = `/courses/${slug}`;
  const nextHref = data.next ? `${base}/${data.next.slug}` : `${base}/assessment`;

  return (
    <Screen automaticallyAdjustKeyboardInsets contentStyle={{ gap: space.xxl }}>
      <Stack.Screen options={{ title: `Lesson ${data.index + 1} of ${data.count}` }} />

      <View style={{ gap: space.md }}>
        <Pressable onPress={() => router.navigate(base)} accessibilityRole="link">
          <Small numberOfLines={1}>
            {data.course.title} · {data.percent}% complete
          </Small>
        </Pressable>
        <Title style={{ fontSize: 30, lineHeight: 32 }}>{lesson.title}</Title>
        <Text style={{ fontSize: 17, lineHeight: 25 }}>{lesson.detail}</Text>
        <View style={{ flexDirection: "row", gap: space.lg, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Clock size={15} color={colors.muted} strokeWidth={1.75} />
            <Small>About {lesson.minutes} minutes</Small>
          </View>
          {data.done && (
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Check size={15} color={colors.positive} strokeWidth={2} />
              <Small style={{ color: colors.positive }}>Completed</Small>
            </View>
          )}
        </View>
      </View>

      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <Target size={14} color={colors.muted} strokeWidth={1.75} />
          <Label style={{ flex: 1 }}>By the end of this lesson you will be able to</Label>
        </View>
        {lesson.objectives.map((o) => (
          <View key={o} style={{ flexDirection: "row", gap: space.md }}>
            <Check size={15} color={colors.ink} strokeWidth={2} style={{ marginTop: 4 }} />
            <Text style={{ flex: 1, color: colors.ink, fontSize: 16, lineHeight: 24 }}>{o}</Text>
          </View>
        ))}
      </Card>

      <LessonBlocks blocks={lesson.blocks} />

      <View style={{ gap: space.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.ink, paddingVertical: space.xl }}>
        <Label>Remember these three things</Label>
        {lesson.takeaways.map((t, i) => (
          <View key={t} style={{ flexDirection: "row", gap: space.lg }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 26, color: colors.ink, width: 22 }}>{i + 1}</Text>
            <Text style={{ flex: 1, fontSize: 17, lineHeight: 26, color: colors.ink }}>{t}</Text>
          </View>
        ))}
      </View>

      <KnowledgeCheck slug={slug} data={data} nextHref={nextHref} nextLabel={data.next ? "Next lesson" : "Go to the assessment"} />

      <Notes slug={slug} data={data} />

      <View style={{ gap: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingTop: space.xl }}>
        {data.prev && (
          <Pressable accessibilityRole="link" onPress={() => router.replace(`${base}/${data.prev!.slug}`)} style={styles.nav}>
            <ArrowLeft size={16} color={colors.ink} strokeWidth={1.75} />
            <View style={{ flex: 1 }}>
              <Small>Previous</Small>
              <Text style={{ color: colors.ink }}>{data.prev.title}</Text>
            </View>
          </Pressable>
        )}
        <Pressable accessibilityRole="link" onPress={() => router.replace(nextHref)} style={styles.nav}>
          <View style={{ flex: 1 }}>
            <Small>{data.next ? "Next" : "Last step"}</Small>
            <Text style={{ color: colors.ink }}>{data.next ? data.next.title : "Final assessment"}</Text>
          </View>
          <ArrowRight size={16} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
      </View>
    </Screen>
  );
}

/** The questions at the end of a lesson. Answering them completes the lesson, and each answer is explained. */
function KnowledgeCheck({ slug, data, nextHref, nextLabel }: { slug: string; data: LessonData; nextHref: string; nextLabel: string }) {
  const qc = useQueryClient();
  const questions = data.lesson.check;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CheckResult | null>(null);
  const submit = useMutation({
    mutationFn: () => api<CheckResult>(`courses/${slug}/lessons/${data.lesson.slug}/check`, { body: { answers } }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
  const answered = questions.every((q) => answers[q.id] != null);
  const byId = new Map(result?.results.map((r) => [r.id, r]));

  return (
    <View style={[styles.panel, { backgroundColor: colors.card }]}>
      <View style={{ gap: space.sm }}>
        <Label>Knowledge check</Label>
        <Heading style={{ fontSize: 20, lineHeight: 25 }}>Check what you've learned before you move on.</Heading>
        <Muted>
          {data.done && !result
            ? "You've completed this lesson. You can answer the questions again whenever you like."
            : "Answer every question to complete the lesson. You'll see why each answer is right as soon as you submit."}
        </Muted>
      </View>

      {questions.map((q, n) => {
        const r = byId.get(q.id);
        return (
          <View key={q.id} style={{ gap: space.md }}>
            <QuestionOptions
              question={q}
              number={n + 1}
              chosen={answers[q.id]}
              onChoose={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))}
              disabled={!!result || submit.isPending}
              marking={r ? { answer: r.answer, wrong: !r.correct } : null}
            />
            {r && (
              <View style={{ borderRadius: radius.md, padding: space.md, backgroundColor: r.correct ? "#e3ece6" : colors.paper2 }}>
                <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22 }}>
                  <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{r.correct ? "That's right. " : "Not quite. "}</Text>
                  {r.explain}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {submit.error && <Small style={{ color: colors.destructive }}>{submit.error.message}</Small>}

      {result ? (
        <View style={{ gap: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingTop: space.lg }}>
          <Text style={{ color: colors.ink }}>
            You answered <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{result.score}</Text> of {result.total} correctly.{" "}
            {result.saved ? "This lesson is now complete." : result.note}
          </Text>
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
            <Button
              title="Try again"
              icon={RotateCcw}
              variant="secondary"
              onPress={() => {
                setAnswers({});
                setResult(null);
              }}
            />
            <Button title={nextLabel} icon={ArrowRight} onPress={() => router.replace(nextHref)} />
          </View>
        </View>
      ) : (
        <Button title="Check my answers" loading={submit.isPending} disabled={!answered} onPress={() => submit.mutate()} />
      )}
    </View>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Private notes and the lesson's reflection. Both save a moment after the learner stops typing, as on the web. */
function Notes({ slug, data }: { slug: string; data: LessonData }) {
  const [notes, setNotes] = useState(data.notes);
  const [reflection, setReflection] = useState(data.reflection);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const latest = useRef({ notes, reflection });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qc = useQueryClient();
  const path = `courses/${slug}/lessons/${data.lesson.slug}/notes`;

  const save = async () => {
    timer.current = null;
    setStatus("saving");
    try {
      await api(path, { body: latest.current });
      setStatus("saved");
      qc.invalidateQueries({ queryKey: ["courses", "detail", slug] });
    } catch {
      setStatus("error");
    }
  };

  const edit = (field: "notes" | "reflection", value: string) => {
    if (field === "notes") setNotes(value);
    else setReflection(value);
    latest.current = { ...latest.current, [field]: value };
    if (!data.canSave) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 900);
  };

  // Leaving the lesson mid-sentence still saves what was typed.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        api(path, { body: latest.current })
          .then(() => qc.invalidateQueries({ queryKey: ["courses"] }))
          .catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const hint = !data.canSave
    ? "Notes are saved once you're enrolled."
    : status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved, and only visible to you."
        : status === "error"
          ? "Couldn't save. We'll try again as you type."
          : "Only visible to you.";

  return (
    <View style={[styles.panel, { backgroundColor: colors.paper2 }]}>
      <View style={{ gap: space.sm }}>
        <Label>Your notes</Label>
        <Heading style={{ fontSize: 20, lineHeight: 25 }}>Write down what you'll change in your practice.</Heading>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityLiveRegion="polite">
          <Lock size={13} color={colors.muted} strokeWidth={1.75} />
          <Small>{hint}</Small>
        </View>
      </View>
      <Input
        label={`Reflection: ${data.lesson.reflection}`}
        value={reflection}
        onChangeText={(v) => edit("reflection", v)}
        editable={data.canSave}
        multiline
        placeholder="A few sentences is enough. This goes into your CPD record."
      />
      <Input
        label="Notes"
        value={notes}
        onChangeText={(v) => edit("notes", v)}
        editable={data.canSave}
        multiline
        placeholder="Anything you want to remember from this lesson."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.xl, borderRadius: radius.xxl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, padding: space.lg },
  nav: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm },
});
