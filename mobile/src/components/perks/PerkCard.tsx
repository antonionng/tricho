import { useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { ArrowUpRight, Check, Copy, Gift } from "lucide-react-native";
import { Badge, Button, Card, Heading, Small, Text } from "@/components/ui";
import { webUrl } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { colors, fonts, radius, space } from "@/theme";
import type { Perk } from "./types";

/** A partner's member offer: what members get, the code to copy, and the link to claim it. */
export function PerkCard({ perk }: { perk: Perk }) {
  const [copied, setCopied] = useState(false);
  const logo = mediaUrl(perk.logo);

  const copy = async () => {
    if (!perk.code) return;
    await Clipboard.setStringAsync(perk.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md }}>
        <View style={{ minHeight: 40, justifyContent: "center" }}>
          {logo ? (
            <Image source={logo} style={{ width: 140, height: 40 }} contentFit="contain" contentPosition="left" accessibilityLabel={`${perk.name} logo`} />
          ) : (
            <Gift size={24} color={colors.ink} strokeWidth={1.5} />
          )}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 6, flexShrink: 1 }}>
          <Badge label={perk.tierLabel} tone={perk.tier === "premium" ? "ink" : "neutral"} />
          <Badge label={perk.category} />
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Heading>{perk.name}</Heading>
        <Text style={{ fontSize: 15.5, lineHeight: 23 }} selectable>
          {perk.perk}
        </Text>
      </View>

      {perk.code && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? `Code ${perk.code} copied` : `Copy the code ${perk.code}`}
          onPress={copy}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.input,
              borderRadius: radius.md,
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              backgroundColor: colors.paper,
            },
            pressed && { backgroundColor: colors.paper2 },
          ]}>
          <View style={{ gap: 2 }}>
            <Small>Your member code</Small>
            <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 18, letterSpacing: 1.5, color: colors.ink }}>{perk.code}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {copied ? <Check size={16} color={colors.positive} strokeWidth={1.75} /> : <Copy size={16} color={colors.ink} strokeWidth={1.75} />}
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: copied ? colors.positive : colors.ink }}>{copied ? "Copied" : "Copy"}</Text>
          </View>
        </Pressable>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.md }}>
        {perk.offerPath && (
          <Button title="Get this offer" icon={ArrowUpRight} size="sm" onPress={() => WebBrowser.openBrowserAsync(webUrl(perk.offerPath!))} />
        )}
        <Button title={`About ${perk.name}`} variant="ghost" size="sm" onPress={() => WebBrowser.openBrowserAsync(webUrl(perk.aboutPath))} />
        <Small>Sponsored</Small>
      </View>
    </Card>
  );
}
