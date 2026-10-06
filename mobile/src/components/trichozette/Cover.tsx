import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui";
import { fonts } from "@/theme";
import type { EditionCard } from "./types";

/**
 * The A4 magazine cover: the portrait, the Trichozette masthead in Bodoni, the
 * dateline and the cover lines. Sized from its width, so the same cover works
 * on the shelf and at the top of the reader.
 */
export function Cover({ edition, width }: { edition: EditionCard; width: number }) {
  const u = width / 100;
  const caps = { fontFamily: fonts.sansMedium, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.85)" };
  return (
    <View
      accessible
      accessibilityLabel={`Trichozette, ${edition.label}: ${edition.title}. ${edition.fade}`}
      style={{ width, aspectRatio: 210 / 297, backgroundColor: "#111", overflow: "hidden" }}>
      <Image source={{ uri: edition.cover.url }} style={{ position: "absolute", inset: 0 }} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.28)" }} />

      <View style={{ position: "absolute", left: 5 * u, right: 5 * u, top: 3.4 * u, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ ...caps, fontSize: Math.max(6, 1.7 * u), letterSpacing: 0.3 * u }}>{edition.label}</Text>
        <Text style={{ ...caps, fontSize: Math.max(6, 1.7 * u), letterSpacing: 0.3 * u }}>{edition.published}</Text>
      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ position: "absolute", left: 0, right: 0, top: 6 * u, textAlign: "center", fontFamily: fonts.didone, fontSize: 12.6 * u, lineHeight: 13 * u, letterSpacing: -0.2 * u, color: "#fff", textTransform: "uppercase" }}>
        Trichozette
      </Text>

      {width >= 220 && (
        <View style={{ position: "absolute", left: 5 * u, top: "42%", width: 46 * u, gap: 3 * u }}>
          {edition.coverLines.map((l, i) => (
            <View key={l}>
              {i === 0 && <View style={{ height: 1, width: 7 * u, backgroundColor: "rgba(255,255,255,0.8)", marginBottom: 0.8 * u }} />}
              <Text style={{ ...caps, fontSize: 1.9 * u, letterSpacing: 0.25 * u, color: "rgba(255,255,255,0.8)" }}>{i === 0 ? "Inside" : "Plus"}</Text>
              <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 3.8 * u, lineHeight: 4.2 * u, color: "#fff", marginTop: 0.6 * u }}>{l}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ position: "absolute", left: 5 * u, right: 5 * u, bottom: 5 * u }}>
        <Text style={{ fontFamily: fonts.didone, fontSize: 8 * u, lineHeight: 8.4 * u, color: "#fff", letterSpacing: -0.15 * u }}>{edition.title}</Text>
        <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 8 * u, lineHeight: 8.4 * u, color: "rgba(255,255,255,0.6)", letterSpacing: -0.15 * u }}>{edition.fade}</Text>
      </View>
    </View>
  );
}
