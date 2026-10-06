import { Platform, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Text } from "@/components/ui";
import { webUrl } from "@/lib/api";
import { appHref } from "@/lib/links";
import { colors, fonts, radius, space } from "@/theme";
import { parseBlocks, parseInline } from "./parse-markdown";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });
const BODY = { fontSize: 15, lineHeight: 23, color: colors.ink };

/** Opens a link from a reply: member pages in the app, everything else in the browser. */
function open(href: string) {
  const target = appHref(href);
  if (!target) return;
  if (typeof target === "object" && "web" in target) {
    WebBrowser.openBrowserAsync(target.web.startsWith("/") ? webUrl(target.web) : target.web).catch(() => {});
  } else {
    router.push(target as Href);
  }
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, i) =>
        s.href ? (
          <Text key={i} accessibilityRole="link" onPress={() => open(s.href!)} style={{ ...BODY, textDecorationLine: "underline" }}>
            {s.text}
          </Text>
        ) : (
          <Text
            key={i}
            style={[
              BODY,
              s.bold && { fontFamily: fonts.sansSemibold },
              s.italic && { fontStyle: "italic" },
              s.code && { fontFamily: MONO, fontSize: 13, backgroundColor: colors.paper2 },
            ]}>
            {s.text}
          </Text>
        )
      )}
    </>
  );
}

/** The Assistant's reply, rendered from its Markdown. */
export function Markdown({ source }: { source: string }) {
  return (
    <View style={{ gap: space.md }}>
      {parseBlocks(source).map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <Text key={i} accessibilityRole="header" style={{ fontFamily: fonts.sansSemibold, fontSize: block.level <= 2 ? 18 : 16, lineHeight: 24, color: colors.ink, marginTop: i ? space.xs : 0 }}>
                <Inline text={block.text} />
              </Text>
            );
          case "paragraph":
            return (
              <Text key={i} selectable style={BODY}>
                <Inline text={block.text} />
              </Text>
            );
          case "list":
            return (
              <View key={i} style={{ gap: 6 }}>
                {block.items.map((item, n) => (
                  <View key={n} style={{ flexDirection: "row", gap: space.sm }}>
                    <Text style={[BODY, { color: colors.muted, minWidth: 16 }]}>{block.ordered ? `${n + 1}.` : "•"}</Text>
                    <Text selectable style={[BODY, { flex: 1 }]}>
                      <Inline text={item} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          case "code":
            return (
              <Text key={i} selectable style={{ fontFamily: MONO, fontSize: 13, lineHeight: 19, color: colors.ink, backgroundColor: colors.paper2, borderRadius: radius.sm, padding: space.md }}>
                {block.text}
              </Text>
            );
          case "rule":
            return <View key={i} style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.rule }} />;
        }
      })}
    </View>
  );
}
