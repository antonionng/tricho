import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Award, Check, ChevronRight, Lock, RotateCcw } from "lucide-react-native";
import { Button, Card, ErrorState, Heading, Label, Loading, Muted, Small, Text, Title } from "@/components/ui";
import { QuestionOptions } from "@/components/courses/Options";
import { longDate, type AssessmentData, type AssessmentResult } from "@/components/courses/types";
import { api } from "@/lib/api";
import { colors, fonts, gutter, radius, space } from "@/theme";

export default function AssessmentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({ queryKey: ["courses", "assessment", slug], queryFn: () => api<AssessmentData>(`courses/${slug}/assessment`) });
  if (query.isLoading) return <Loading />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <Assessment slug={slug} data={query.data} />;
}

function Assessment({ slug, data }: { slug: string; data: AssessmentData }) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const base = `/courses/${slug}`;
  const submit = useMutation({
    mutationFn: () => api<AssessmentResult>(`courses/${slug}/assessment`, { body: { answers } }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ["courses", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["courses", "list"] });
      scroll.current?.scrollTo({ y: 0, animated: true });
    },
  });
  const count = data.questions.filter((q) => answers[q.id] != null).length;
  const wrong = new Set(result?.wrong);
  const certificate = data.certificate;
  const taking = !certificate && !data.locked && !result;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: "Final assessment" }} />
      <ScrollView
        ref={scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: gutter, paddingBottom: space.xxxl, gap: space.lg }}>
        <Small numberOfLines={1}>{data.course.title}</Small>
        <Title>Show what you've learned.</Title>
        <Text style={{ fontSize: 16, lineHeight: 24 }}>
          {data.total} questions drawn from every lesson. Score {data.needed} or more to pass and earn your certificate. Take your time: there's no timer and no limit on retakes.
        </Text>

        {result && (
          <View accessibilityLiveRegion="polite" style={[styles.result, result.passed ? { backgroundColor: colors.ink } : { backgroundColor: colors.paper2, borderWidth: 1, borderColor: colors.rule }]}>
            {result.passed && <Award size={30} color={colors.onInk} strokeWidth={1.4} />}
            <Title style={{ color: result.passed ? colors.onInk : colors.ink }}>
              {result.passed
                ? "You passed, and your certificate is ready."
                : result.score >= result.needed - 2
                  ? "You're nearly there."
                  : "Not this time, but you can take it again."}
            </Title>
            <Text style={{ color: result.passed ? "#cfcfcc" : colors.ink2, fontSize: 16, lineHeight: 24 }}>
              You scored {result.score} out of {result.total}. {result.passed ? "" : `You need ${result.needed} to pass. `}
              {result.passed
                ? "Each answer is explained below, so you can check your reasoning on any you weren't sure of."
                : `The ${result.wrong.length === 1 ? "question" : `${result.wrong.length} questions`} marked below need another look. Go back over the lessons they cover, then take the assessment again. There's no limit on retakes.`}
            </Text>
            {result.passed && result.certificate ? (
              <Button
                title="See your certificate"
                icon={ArrowRight}
                variant="secondary"
                onPress={() => router.replace(`${base}/certificate`)}
              />
            ) : (
              <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
                <Button
                  title="Take it again"
                  icon={RotateCcw}
                  onPress={() => {
                    setAnswers({});
                    setResult(null);
                    scroll.current?.scrollTo({ y: 0, animated: true });
                  }}
                />
                <Button title="Back to the lessons" variant="secondary" onPress={() => router.navigate(base)} />
              </View>
            )}
          </View>
        )}

        {certificate ? (
          <>
            <View style={[styles.result, { backgroundColor: colors.ink }]}>
              <Award size={30} color={colors.onInk} strokeWidth={1.4} />
              <Title style={{ color: colors.onInk }}>You passed on {longDate(certificate.issuedAt)}.</Title>
              <Text style={{ color: "#cfcfcc" }}>
                You scored {certificate.score} out of {certificate.total}, and your certificate is ready to share.
              </Text>
              <Button title="See your certificate" icon={ArrowRight} variant="secondary" onPress={() => router.push(`${base}/certificate`)} />
            </View>
            <Label>Review every answer</Label>
            {(data.review ?? []).map((q, n) => (
              <Card key={q.id} style={{ gap: space.md }}>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>
                  <Text style={{ color: colors.muted }}>{n + 1}. </Text>
                  {q.prompt}
                </Text>
                <View style={{ flexDirection: "row", gap: space.sm, backgroundColor: "#e3ece6", borderRadius: radius.md, padding: space.md }}>
                  <Check size={16} color={colors.positive} strokeWidth={2} style={{ marginTop: 3 }} />
                  <Text style={{ flex: 1, color: colors.ink }}>{q.answer}</Text>
                </View>
                <Text>{q.explain}</Text>
              </Card>
            ))}
          </>
        ) : data.locked ? (
          <Card style={{ gap: space.md }}>
            <Lock size={22} color={colors.ink} strokeWidth={1.5} />
            <Heading>The assessment opens when you've completed every lesson.</Heading>
            <Muted>
              You have {data.remaining.length} {data.remaining.length === 1 ? "lesson" : "lessons"} left. A lesson is complete once you've answered its knowledge check.
            </Muted>
            {data.remaining.map((l) => (
              <Pressable
                key={l.slug}
                accessibilityRole="link"
                onPress={() => router.push(`${base}/${l.slug}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }}>
                <Text style={{ flex: 1, color: colors.ink }}>{l.title}</Text>
                <ChevronRight size={18} color={colors.mute} strokeWidth={1.75} />
              </Pressable>
            ))}
          </Card>
        ) : (
          <>
            {!result && data.attempts.length > 0 && (
              <Small>
                Your previous attempts: {data.attempts.map((a) => `${a.score} of ${a.total} on ${longDate(a.createdAt)}`).join(", ")}.
              </Small>
            )}
            {!result && (
              <Card style={{ gap: space.sm }}>
                <Text>
                  Your certificate will be issued in the name <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{data.holderName}</Text>. If that isn't how you
                  want it to read, change your name in your profile before you start.
                </Text>
                <Button title="Change my name" variant="secondary" size="sm" onPress={() => router.push("/profile")} />
              </Card>
            )}
            {data.questions.map((q, n) => {
              const explained = result?.explanations?.[q.id];
              return (
                <Card
                  key={q.id}
                  style={[{ gap: space.md }, result && !result.passed && wrong.has(q.id) ? { borderColor: "#d9a59e", borderWidth: 1 } : null]}>
                  <QuestionOptions
                    question={q}
                    number={n + 1}
                    chosen={answers[q.id]}
                    onChoose={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    disabled={!!result || submit.isPending}
                    marking={explained ? { answer: explained.answer } : null}
                    flag={result ? !wrong.has(q.id) : null}
                  />
                  {explained && (
                    <View style={{ backgroundColor: colors.paper2, borderRadius: radius.md, padding: space.md }}>
                      <Text style={{ fontSize: 15, lineHeight: 22 }}>{explained.explain}</Text>
                    </View>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {taking && data.questions.length > 0 && (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Small style={{ color: colors.ink2 }}>
              {count} of {data.questions.length} answered. You need {data.needed} correct to pass.
            </Small>
            {submit.error && <Small style={{ color: colors.destructive }}>{submit.error.message}</Small>}
          </View>
          <Button title="Submit my answers" size="sm" loading={submit.isPending} disabled={count < data.questions.length} onPress={() => submit.mutate()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  result: { gap: space.md, borderRadius: radius.xxl, padding: space.xl },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: gutter,
    paddingTop: space.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
  },
});
