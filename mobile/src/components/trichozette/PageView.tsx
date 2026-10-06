import { Pressable, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Text } from "@/components/ui";
import { fonts, gutter, space } from "@/theme";
import { Blocks, magText } from "./Blocks";
import { mag, type Art, type Page } from "./types";

const DISCIPLINE = { cosmetic: "The cosmetic chair", clinical: "The trichology clinic", medical: "The medical consulting room" } as const;

const { caps, body } = magText;

function Kicker({ children, light }: { children: string; light?: boolean }) {
  return <Text style={[caps, light && { color: "rgba(255,255,255,0.75)" }]}>{children}</Text>;
}

function Headline({ children, italic, size = 40, light }: { children: string; italic?: boolean; size?: number; light?: boolean }) {
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: italic ? fonts.didoneItalic : fonts.didone, fontSize: size, lineHeight: size * 1.02, letterSpacing: -size * 0.02, color: light ? "#fff" : mag.ink }}>
      {children}
    </Text>
  );
}

function Standfirst({ children, light }: { children: string; light?: boolean }) {
  return <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 20, lineHeight: 26, color: light ? "rgba(255,255,255,0.85)" : "rgba(11,11,11,0.75)" }}>{children}</Text>;
}

function Photo({ art, height, children }: { art: Art; height: number; children?: React.ReactNode }) {
  return (
    <View style={{ height, backgroundColor: "#111" }}>
      <Image source={{ uri: art.url }} alt={art.alt} style={{ position: "absolute", inset: 0 }} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />
      <View style={{ position: "absolute", left: gutter, right: gutter, bottom: space.xxl, gap: space.md }}>
        {children}
        <Text style={[caps, { fontSize: 9, color: "rgba(255,255,255,0.55)" }]}>Photograph {art.credit} / Unsplash</Text>
      </View>
    </View>
  );
}

const Column = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <View style={{ backgroundColor: dark ? mag.ink : mag.paper, paddingHorizontal: gutter, paddingVertical: space.xxxl, gap: space.lg }}>{children}</View>
);

/** One page of an edition, laid out for a phone in the magazine's typography. */
export function PageView({ page }: { page: Page }) {
  const { width, height } = useWindowDimensions();
  const tall = Math.min(height * 0.8, width * 1.35);

  switch (page.kind) {
    case "letter":
      return (
        <Column>
          <Kicker>Letter</Kicker>
          <Headline italic size={46}>{page.title}</Headline>
          <Blocks blocks={page.blocks} dropCap />
          <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 22, color: mag.ink, textAlign: "right" }}>{page.signoff}</Text>
        </Column>
      );
    case "article":
      return (
        <View>
          <Photo art={page.image} height={tall}>
            <Kicker light>{page.kicker}</Kicker>
            <Headline light size={44}>{page.title}</Headline>
            <Standfirst light>{page.standfirst}</Standfirst>
          </Photo>
          <Column>
            <Text style={[caps, { fontSize: 9 }]}>Words by the Trichollective editorial team</Text>
            <Blocks blocks={page.blocks} dropCap />
          </Column>
        </View>
      );
    case "image":
      return (
        <Photo art={page.image} height={tall}>
          <View style={{ width: 56, height: 1, backgroundColor: "#fff" }} />
          <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 28, lineHeight: 32, color: "#fff" }}>{page.caption}</Text>
        </Photo>
      );
    case "glance":
      return (
        <Column dark>
          <Kicker light>{page.kicker}</Kicker>
          <Headline light size={42}>{page.title}</Headline>
          {page.rows.map((r, i) => (
            <View key={r.label} style={{ borderTopWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingTop: space.lg, gap: space.sm }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.md }}>
                <Text style={{ fontFamily: fonts.didone, fontSize: 36, lineHeight: 38, color: "rgba(255,255,255,0.35)" }}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={[caps, { flex: 1, color: "rgba(255,255,255,0.6)" }]}>{r.label}</Text>
              </View>
              <Text style={{ ...body, fontSize: 17, lineHeight: 26, color: "rgba(255,255,255,0.9)" }}>{r.value}</Text>
            </View>
          ))}
        </Column>
      );
    case "interactive":
      return (
        <Column>
          <Kicker>{page.kicker}</Kicker>
          <Headline size={42}>{page.title}</Headline>
          <Standfirst>{page.intro}</Standfirst>
          <Blocks blocks={page.blocks} />
        </Column>
      );
    case "perspectives":
      return (
        <Column>
          <Kicker>{page.kicker}</Kicker>
          <Headline size={42}>{page.title}</Headline>
          <Standfirst>{page.intro}</Standfirst>
          {page.views.map((v) => (
            <View key={v.discipline} style={{ borderTopWidth: 1, borderColor: mag.ink, paddingTop: space.lg, gap: space.md, marginTop: space.md }}>
              <Kicker>{DISCIPLINE[v.discipline]}</Kicker>
              <Headline italic size={28}>{v.heading}</Headline>
              <Blocks blocks={v.blocks} />
            </View>
          ))}
        </Column>
      );
    case "news":
      return (
        <Column>
          <Kicker>{page.kicker}</Kicker>
          <Headline size={46}>Dispatches</Headline>
          <Standfirst>{page.intro}</Standfirst>
          {page.items.map((n) => (
            <View key={n.id} style={{ borderTopWidth: 1, borderColor: mag.faint, paddingTop: space.lg, gap: space.md }}>
              <Text style={[caps, { fontSize: 9 }]}>
                {n.date.split("-").reverse().join(".")} · {n.source}
              </Text>
              <Headline size={24}>{n.headline}</Headline>
              <Text style={body}>{n.summary}</Text>
              <View style={{ borderLeftWidth: 1, borderColor: mag.ink, paddingLeft: space.lg }}>
                <Text style={{ ...body, fontSize: 15.5, lineHeight: 24 }}>{n.whyItMatters}</Text>
              </View>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={() => WebBrowser.openBrowserAsync(n.url)}>
                <Text style={[caps, { color: mag.ink, textDecorationLine: "underline" }]}>Read the source</Text>
              </Pressable>
            </View>
          ))}
        </Column>
      );
  }
}
