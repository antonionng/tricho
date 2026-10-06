import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react-native";
import { Avatar, Badge, Button, Card, ErrorState, Heading, Input, Label, Loading, Muted, Screen, Section, Small, Text } from "@/components/ui";
import { Notice } from "@/components/referrals/Notice";
import { longDate } from "@/components/referrals/format";
import type { ReferralDetail } from "@/components/referrals/types";
import { api } from "@/lib/api";
import { meKey } from "@/lib/me";
import { colors, space } from "@/theme";

const NOTE_MAX = 1000;

function Field({ label, children }: { label: string; children: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <Text style={{ color: colors.ink }}>{children}</Text>
    </View>
  );
}

/** One referral: the concern, its status, and the recipient's answer. */
export default function ReferralScreen() {
  const { id, sent } = useLocalSearchParams<{ id: string; sent?: string }>();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [answered, setAnswered] = useState(false);

  const q = useQuery({
    queryKey: ["referrals", "detail", id],
    queryFn: async () => {
      const r = await api<ReferralDetail>(`referrals/${id}`);
      // Opening a new referral marks it read, so the badge count changes.
      qc.invalidateQueries({ queryKey: meKey });
      qc.invalidateQueries({ queryKey: ["referrals", "list"] });
      return r;
    },
  });

  const respond = useMutation({
    mutationFn: (decision: "accept" | "decline") => api(`referrals/${id}/respond`, { body: { decision, note } }),
    onSuccess: () => {
      setAnswered(true);
      qc.invalidateQueries({ queryKey: ["referrals"] });
      qc.invalidateQueries({ queryKey: meKey });
    },
  });

  const message = useMutation({
    mutationFn: () => api<{ conversationId: string }>(`referrals/${id}/message`, { method: "POST" }),
    onSuccess: (r) => router.push(`/messages/${r.conversationId}`),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const r = q.data;
  const isRecipient = r.side === "received";

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Referral" }} />

      {sent && <Notice tone="positive">{`Your referral has been sent. ${r.other.shortName} has been notified, and you will hear back here and by email when they respond.`}</Notice>}
      {answered && <Notice tone="positive">{`Your answer has been sent to ${r.other.shortName}. You can message them to arrange the next step.`}</Notice>}

      <Card style={{ gap: space.lg }}>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/people/${r.other.id}`)} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
          <Avatar name={r.other.name} image={r.other.image} size={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Label>{isRecipient ? "Referral from" : "Referral to"}</Label>
            <Heading>{r.other.name || "A member"}</Heading>
            <Small>Sent on {longDate(r.createdAt)}</Small>
          </View>
          <Badge label={r.statusLabel} tone={r.status === "accepted" ? "positive" : r.status === "sent" && isRecipient ? "ink" : "neutral"} />
        </Pressable>

        <Text>{r.statusSentence}</Text>

        <Field label="The client's concern">{r.summary}</Field>
        {r.reason ? <Field label="Why this referral">{r.reason}</Field> : null}
        {r.clientContext ? <Field label="Context">{r.clientContext}</Field> : null}
        {r.respondedAt ? (
          <Field label={`${r.status === "accepted" ? "Accepted" : "Declined"} on ${longDate(r.respondedAt)}`}>
            {r.responseNote || (isRecipient ? "You did not leave a note." : `${r.other.shortName} did not leave a note.`)}
          </Field>
        ) : null}

        <Button title={`Message ${r.other.shortName}`} variant="secondary" icon={MessageCircle} loading={message.isPending} onPress={() => message.mutate()} />
        {message.error && <Notice tone="error">{message.error.message}</Notice>}
      </Card>

      {r.canRespond && !answered && (
        <Section title="Your answer">
          <Card style={{ gap: space.lg }}>
            <Input
              label={`A note for ${r.other.shortName} (optional)`}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={NOTE_MAX}
              placeholder="For example, when you can see the client and how they should get in touch, or a colleague who may be better placed to help."
              hint={`${r.other.shortName} is told straight away. Please keep the note free of the client's personal details.`}
            />
            {respond.error && <Notice tone="error">{respond.error.message}</Notice>}
            <View style={{ gap: space.sm }}>
              <Button title="Accept the referral" full loading={respond.isPending && respond.variables === "accept"} disabled={respond.isPending} onPress={() => respond.mutate("accept")} />
              <Button
                title="Decline the referral"
                variant="secondary"
                full
                loading={respond.isPending && respond.variables === "decline"}
                disabled={respond.isPending}
                onPress={() => respond.mutate("decline")}
              />
            </View>
            <Muted style={{ fontSize: 13 }}>Accepting or declining is final, and {r.other.shortName} is told by email.</Muted>
          </Card>
        </Section>
      )}
    </Screen>
  );
}
