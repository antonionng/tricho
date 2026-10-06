import { View } from "react-native";
import { BarChart3 } from "lucide-react-native";
import { Card, Heading, Muted, Small, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import type { StatDay, StatField , BusinessDashboard } from "./types";

type Results = Extract<BusinessDashboard, { page: object }>["results"];

/** One bar per day, today on the right. */
function Bars({ series, field, label }: { series: StatDay[]; field: StatField; label: string }) {
  const max = Math.max(1, ...series.map((d) => d[field]));
  const best = series.reduce((a, b) => (b[field] > a[field] ? b : a), series[0]);
  const summary = best && best[field] > 0 ? `${label} by day. The busiest day was ${best.day}, with ${best[field]}.` : `${label} by day. There are none yet.`;
  return (
    <View accessible accessibilityLabel={summary} style={{ height: 32, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
      {series.map((d) => {
        const v = d[field];
        return <View key={d.day} style={{ flex: 1, height: v ? Math.max(2, (v / max) * 32) : 1, borderRadius: 1, backgroundColor: v ? colors.ink : colors.rule }} />;
      })}
    </View>
  );
}

/** The brand's figures for the last 30 days, in the website's words. */
export function BusinessResults({ results, published, hasPerk, onAddPerk }: { results: Results; published: boolean; hasPerk: boolean; onAddPerk: () => void }) {
  if (results.nothingYet) {
    return (
      <Card style={{ flexDirection: "row", gap: space.md }}>
        <BarChart3 size={22} color={colors.mute} strokeWidth={1.5} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Heading style={{ fontSize: 15 }}>
            {published
              ? "Your figures will appear here as soon as professionals start visiting your page."
              : "Your figures will appear here once your page is live and professionals start visiting it."}
          </Heading>
          <Small style={{ color: colors.ink2 }}>
            {`We show page views, visits to your website, how often members see your perk and how often they claim it, for the last ${results.days} days. We count real visits only, never search engines, the Trichollective team or your own visits while signed in.`}
          </Small>
          {!hasPerk && (
            <Small style={{ color: colors.ink2 }} onPress={onAddPerk} accessibilityRole="link">
              Perk views and claims start once you add a member perk, which you can do in the perk step on the website.
            </Small>
          )}
        </View>
      </Card>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      <Muted style={{ fontSize: 14 }}>
        These figures show how hair and scalp professionals have found and used your page and perk. We count real visits only, never search engines,
        the Trichollective team or your own visits while signed in.
      </Muted>
      {results.metrics.map((m) => (
        <Card key={m.field} style={{ gap: space.sm, borderRadius: radius.md }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>{m.label}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, fontVariant: ["tabular-nums"] }}>{m.total.toLocaleString("en-GB")}</Text>
          </View>
          <Bars series={results.series} field={m.field} label={m.label} />
          <Small>{m.explain}</Small>
        </Card>
      ))}
      <Small>Each bar is one day, with today on the right. Days are counted in UTC.</Small>
    </View>
  );
}
