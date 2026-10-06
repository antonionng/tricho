import { useState } from "react";
import { Share, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { Copy, Share2 } from "lucide-react-native";
import { Badge, Button, Card, Empty, ErrorState, Loading, Muted, Rule, Screen, Section, Small, Text, Title } from "@/components/ui";
import { api, webUrl } from "@/lib/api";
import { colors, fonts, space } from "@/theme";

type Refer = {
  code: string;
  link: string;
  message: string;
  subject: string;
  paying: boolean;
  stats: { label: string; value: string }[];
  rewards: { id: string; name: string; status: "pending" | "banked" | "credited" | "void"; statusLabel: string; date: string }[];
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Invite a colleague with the member's own link, as on /members/refer. */
export default function ReferScreen() {
  const query = useQuery({ queryKey: ["refer"], queryFn: () => api<Refer>("refer") });
  const [copied, setCopied] = useState(false);

  if (query.isPending) return <Loading />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const r = query.data;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: "Invite a colleague" }} />
      <Title>Invite a colleague, and get a month free for each one who joins.</Title>
      <Muted>
        When a colleague joins Trichollective with your link, they pay half price for their first month and you get a month of your own
        membership free.
      </Muted>

      <Section title="Your invitation link">
        <Card style={{ gap: space.md }}>
          <Text selectable style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>
            {r.link}
          </Text>
          <Small>
            Your code is <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink, fontSize: 13 }}>{r.code}</Text>, which colleagues can
            also type in if they find it easier.
          </Small>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <Button
              title="Share your link"
              icon={Share2}
              onPress={() => Share.share({ message: r.message, title: r.subject }, { subject: r.subject }).catch(() => {})}
            />
            <Button
              title={copied ? "Link copied" : "Copy link"}
              variant="secondary"
              icon={Copy}
              onPress={async () => {
                await Clipboard.setStringAsync(r.link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
          </View>
        </Card>
      </Section>

      <Section title="How it works">
        <Text>1. Share your link with a hair or scalp professional who would value the community, the Case Room and recorded CPD.</Text>
        <Text>2. When they join with your link, half of one month&apos;s price comes off their first payment.</Text>
        <Text>
          3. Once their first payment clears, one month of your own membership is credited to your bill
          {r.paying ? ", and it comes off your next payment automatically." : ", and we keep it for you until you become a paying member."}
        </Text>
        <Small>
          Rewards are bill credit rather than cash, and the full conditions are in the{" "}
          <Text
            accessibilityRole="link"
            onPress={() => WebBrowser.openBrowserAsync(webUrl("/terms#referral-rewards")).catch(() => {})}
            style={{ color: colors.ink, textDecorationLine: "underline", fontSize: 13 }}>
            terms of membership
          </Text>
          .
        </Small>
      </Section>

      <Section title="Your invitations">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {r.stats.map((s) => (
            <Card key={s.label} style={{ flexBasis: "47%", flexGrow: 1, gap: space.xs }}>
              <Small>{s.label}</Small>
              <Title>{s.value}</Title>
            </Card>
          ))}
        </View>
        {r.rewards.length === 0 ? (
          <Empty
            title="Nobody has joined with your link yet."
            body="Colleagues who join with your link will appear here, with the progress of each reward."
          />
        ) : (
          <Card style={{ padding: 0 }}>
            {r.rewards.map((reward, i) => (
              <View key={reward.id}>
                {i > 0 && <Rule />}
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.ink }}>{reward.name}</Text>
                    <Badge
                      label={reward.statusLabel}
                      tone={reward.status === "credited" ? "positive" : reward.status === "banked" ? "ink" : "neutral"}
                    />
                  </View>
                  <Small>{shortDate(reward.date)}</Small>
                </View>
              </View>
            ))}
          </Card>
        )}
      </Section>
    </Screen>
  );
}
