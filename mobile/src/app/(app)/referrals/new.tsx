import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react-native";
import { Button, Card, Empty, ErrorState, Heading, Input, Loading, Muted, Screen, Text, Title } from "@/components/ui";
import { Notice } from "@/components/referrals/Notice";
import type { Finding, RecipientInfo, SendResult } from "@/components/referrals/types";
import { api, ApiError } from "@/lib/api";
import { colors, fonts, radius, space } from "@/theme";

/** Refer a client to a colleague: a summary of the concern that never identifies the client. */
export default function NewReferralScreen() {
  const { to = "" } = useLocalSearchParams<{ to?: string }>();
  const qc = useQueryClient();
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [clientContext, setClientContext] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["referrals", "recipient", to],
    queryFn: () => api<RecipientInfo>(`referrals/recipient?to=${encodeURIComponent(to)}`),
    enabled: !!to,
  });

  const send = useMutation({
    mutationFn: () => api<SendResult>("referrals", { body: { to, summary, reason, clientContext, confirm: needsConfirm && confirmed } }),
    onSuccess: (r) => {
      if (r.ok) {
        qc.invalidateQueries({ queryKey: ["referrals"] });
        router.replace({ pathname: "/referrals/[id]", params: { id: r.id, sent: "1" } });
        return;
      }
      setError(r.error ?? null);
      setFindings(r.findings ?? []);
      setNeedsConfirm(!!r.needsConfirm);
      setConfirmed(false);
    },
    onError: (e) => {
      const data = e instanceof ApiError ? (e.data as { findings?: Finding[] } | undefined) : undefined;
      setError(e.message);
      setFindings(data?.findings ?? []);
      setNeedsConfirm(false);
    },
  });

  if (!to) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Refer a client" }} />
        <Empty
          title="Choose a colleague to refer a client to."
          body="Open a colleague's profile in the member directory and choose Refer a client."
          action={{ title: "Find a colleague", onPress: () => router.replace("/people") }}
        />
      </Screen>
    );
  }
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;

  const { recipient, blocker, limits, professional } = q.data;
  if (!professional) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Refer a client" }} />
        <Empty
          title="Referrals are part of Professional membership."
          body="Professional members can refer clients to trusted colleagues across the network, and hear back when the referral is accepted."
          action={{ title: "See the Professional plan", onPress: () => router.push("/membership") }}
        />
      </Screen>
    );
  }
  if (blocker || !recipient) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Refer a client" }} />
        <Empty
          title={blocker ?? "We could not find this member."}
          body="You can find another colleague who accepts referrals in the member directory."
          action={{ title: "Find a colleague", onPress: () => router.replace("/people") }}
        />
      </Screen>
    );
  }

  const short = recipient.shortName;
  const blocked = findings.some((f) => f.severity === "block");
  const tooShort = summary.trim().length < limits.summaryMin;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Refer a client" }} />
      <Title>{`Refer a client to ${recipient.name || "this member"}.`}</Title>
      <Muted>{`Send ${short} a short summary of what your client needs. They can read it, accept or decline, and message you to arrange the introduction.`}</Muted>

      <Card style={{ flexDirection: "row", gap: space.md }}>
        <ShieldCheck size={20} color={colors.ink} strokeWidth={1.75} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Heading style={{ fontSize: 15 }}>A referral describes the concern, never the person.</Heading>
          <Text variant="small" style={{ color: colors.ink2 }}>
            {`Please do not include the client's name, date of birth, address, email, phone number or photographs. Once ${short} accepts, you can introduce the client directly with their consent.`}
          </Text>
          <Text variant="small" style={{ color: colors.ink2 }}>
            {`Only ${short} and you can read the summary. The Trichollective team can see that a referral was made, and only opens the summary if there is a safety or moderation concern.`}
          </Text>
        </View>
      </Card>

      <Input
        label="What is the client's concern?"
        value={summary}
        onChangeText={setSummary}
        multiline
        maxLength={limits.summaryMax}
        style={{ minHeight: 160 }}
        placeholder="For example: diffuse shedding for about six months, starting after a period of illness. Bloods from her GP showed low ferritin. She would like a trichologist's assessment and a treatment plan."
        hint={`Describe the concern, how long it has been going on and anything already tried, in ${limits.summaryMin} to ${limits.summaryMax.toLocaleString("en-GB")} characters.`}
      />
      <Input
        label={`Why are you referring the client to ${short}? (optional)`}
        value={reason}
        onChangeText={setReason}
        maxLength={limits.reasonMax}
        placeholder="For example: she needs a scalp biopsy, which is outside my scope."
      />
      <Input
        label="Non-identifying context (optional)"
        value={clientContext}
        onChangeText={setClientContext}
        maxLength={limits.contextMax}
        placeholder="For example: woman in her 40s, Dublin area"
        hint="An age range and a general area are enough. Never include a name, date of birth or contact details."
      />

      {findings.length > 0 && (
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: "row",
            gap: space.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            padding: space.lg,
            borderColor: blocked ? "#e8c3be" : colors.rule,
            backgroundColor: blocked ? "#f7e9e7" : colors.paper2,
          }}>
          <ShieldAlert size={20} color={blocked ? colors.destructive : colors.ink} strokeWidth={1.75} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: space.sm }}>
            <Text style={{ fontFamily: fonts.sansMedium, color: blocked ? colors.destructive : colors.ink }}>
              {blocked
                ? "Your referral contains contact details, so it has not been sent."
                : "Your referral may contain details that could identify the client. Please check it before you send it."}
            </Text>
            {findings.map((f) => (
              <Text key={f.kind} variant="small" style={{ color: blocked ? colors.destructive : colors.ink2 }}>
                {`• ${f.message}`}
              </Text>
            ))}
          </View>
        </View>
      )}

      {needsConfirm && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          onPress={() => setConfirmed((c) => !c)}
          style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
          <View
            style={{
              width: 22,
              height: 22,
              marginTop: 1,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: colors.ink,
              backgroundColor: confirmed ? colors.ink : colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}>
            {confirmed && <Check size={15} color={colors.onInk} strokeWidth={2.5} />}
          </View>
          <Text style={{ flex: 1, color: colors.ink }}>I have checked this referral, and nothing in it identifies the client.</Text>
        </Pressable>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <Button
        title={`Send the referral to ${short}`}
        full
        loading={send.isPending}
        disabled={tooShort || (needsConfirm && !confirmed)}
        onPress={() => {
          setError(null);
          send.mutate();
        }}
      />
    </Screen>
  );
}
