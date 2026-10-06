import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Card, Empty, ErrorState, Loading, Muted, Rule, Screen, Small, Text } from "@/components/ui";
import type { ReferralList } from "@/components/referrals/types";
import { timeAgo } from "@/components/referrals/format";
import { api } from "@/lib/api";
import { colors, fonts, radius, space } from "@/theme";

/** Clients members have referred to each other, received and sent, as on /members/referrals. */
export default function ReferralsScreen() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const q = useQuery({
    queryKey: ["referrals", "list", tab],
    queryFn: () => api<ReferralList>(`referrals?tab=${tab}`),
  });
  const d = q.data;
  const tabs = [
    { id: "received" as const, label: d ? (d.counts.waiting ? `Received (${d.counts.waiting} new)` : `Received (${d.counts.received})`) : "Received" },
    { id: "sent" as const, label: d ? `Sent (${d.counts.sent})` : "Sent" },
  ];

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Client referrals" }} />
      <Muted>
        Clients you and your colleagues have referred to each other. Each referral describes the concern without identifying the client, and the
        introduction happens once it is accepted.
      </Muted>

      <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: space.sm }}>
        {tabs.map((t) => {
          const selected = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setTab(t.id)}
              style={{
                height: 40,
                paddingHorizontal: 16,
                borderRadius: radius.pill,
                borderWidth: 1,
                justifyContent: "center",
                borderColor: selected ? colors.ink : colors.rule,
                backgroundColor: selected ? colors.ink : colors.card,
              }}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: selected ? colors.onInk : colors.ink2 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : !d?.referrals.length ? (
        <Empty
          title={tab === "sent" ? "You have not referred a client yet." : "Nobody has referred a client to you yet."}
          body={
            d?.professional
              ? "To refer a client, open a colleague's profile and choose Refer a client. They will be notified straight away and can reply to you in Messages."
              : "Professional members can refer clients to each other. Referrals sent to you will appear here, and you can accept or decline each one."
          }
          action={{ title: "Find a colleague", onPress: () => router.push("/people") }}
        />
      ) : (
        <Card style={{ padding: 0 }}>
          {d.referrals.map((r, i) => (
            <View key={r.id}>
              {i > 0 && <Rule />}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/referrals/${r.id}`)}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }, pressed && { backgroundColor: colors.paper2 }]}>
                <Avatar name={r.other.name} image={r.other.image} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontFamily: r.isNew ? fonts.sansSemibold : fonts.sansMedium }}>
                      {tab === "sent" ? `To ${r.other.name || "a member"}` : `From ${r.other.name || "a member"}`}
                    </Text>
                    <Small>{timeAgo(r.createdAt)}</Small>
                  </View>
                  <Small numberOfLines={1}>{r.preview}</Small>
                </View>
                <Badge label={r.statusLabel} tone={r.status === "accepted" ? "positive" : r.isNew ? "ink" : "neutral"} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
