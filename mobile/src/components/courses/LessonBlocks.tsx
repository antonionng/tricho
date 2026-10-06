import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Lightbulb, MessageSquareQuote, ShieldAlert, TriangleAlert, Users, type LucideIcon } from "lucide-react-native";
import { Button, Label, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import type { CalloutTone, LessonBlock } from "./types";

const READ = { fontSize: 17, lineHeight: 27, color: colors.ink };

const CALLOUT: Record<CalloutTone, { icon: LucideIcon; label: string; bg: string; border: string }> = {
  tip: { icon: Lightbulb, label: "In practice", bg: colors.paper2, border: colors.rule },
  caution: { icon: TriangleAlert, label: "Take care", bg: "#fbf3e2", border: "#ecd49a" },
  redflag: { icon: ShieldAlert, label: "Red flag", bg: "#f8ecea", border: "#e4bdb7" },
  scope: { icon: Users, label: "Scope of practice", bg: "#eaf1ec", border: "#bcd2c4" },
};

/** A lesson's teaching content in the house reading style, matching the website. */
export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <View style={{ gap: space.xl }}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </View>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "p":
      return <Text style={READ}>{block.text}</Text>;
    case "h":
      return (
        <Text accessibilityRole="header" style={{ marginTop: space.md, fontFamily: fonts.sansSemibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.3, color: colors.ink }}>
          {block.text}
        </Text>
      );
    case "list":
      return (
        <View style={{ gap: space.sm }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.md }}>
              <Text style={[READ, { color: colors.muted, minWidth: 18 }]}>{block.ordered ? `${i + 1}.` : "•"}</Text>
              <Text style={[READ, { flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case "callout": {
      const tone = CALLOUT[block.tone];
      const Icon = tone.icon;
      return (
        <View style={[styles.box, { backgroundColor: tone.bg, borderColor: tone.border, flexDirection: "row", gap: space.md }]}>
          <Icon size={20} color={colors.ink} strokeWidth={1.75} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Label>{tone.label}</Label>
            <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink, fontSize: 16 }}>{block.title}</Text>
            <Text style={{ fontSize: 16, lineHeight: 25 }}>{block.text}</Text>
          </View>
        </View>
      );
    }
    case "case":
      return <CaseStudy block={block} />;
    case "script":
      return (
        <View style={{ backgroundColor: colors.ink, borderRadius: radius.lg, padding: space.xl, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <MessageSquareQuote size={16} color="#a9a9a6" strokeWidth={1.75} />
            <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#a9a9a6" }}>{block.title}</Text>
          </View>
          {block.lines.map((line, i) => (
            <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: "#4a4a48", paddingLeft: space.lg }}>
              <Text style={{ fontSize: 16, lineHeight: 25, color: colors.onInk }}>{line}</Text>
            </View>
          ))}
        </View>
      );
    case "steps":
      return (
        <View style={{ gap: space.md }}>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 17, color: colors.ink }}>{block.title}</Text>
          <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }}>
            {block.steps.map((step, i) => (
              <View key={i} style={{ flexDirection: "row", gap: space.lg, paddingVertical: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }}>
                <View style={styles.number}>
                  <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.ink }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink }}>{step.title}</Text>
                  <Text style={{ fontSize: 16, lineHeight: 25 }}>{step.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    case "table":
      return (
        <View style={{ gap: space.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
            <View>
              <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: colors.ink }}>
                {block.head.map((h, c) => (
                  <Text key={c} style={[styles.cell, { fontFamily: fonts.sansSemibold, color: colors.ink }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {block.rows.map((row, r) => (
                <View key={r} style={{ flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }}>
                  {row.map((cell, c) => (
                    <Text key={c} style={[styles.cell, c === 0 ? { fontFamily: fonts.sansMedium, color: colors.ink } : null]}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <Text variant="small">{block.caption}</Text>
        </View>
      );
    case "terms":
      return (
        <View style={[styles.box, { padding: 0, overflow: "hidden" }]}>
          {block.items.map((t, i) => (
            <View key={i} style={{ padding: space.lg, gap: 4, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.rule }}>
              <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink }}>{t.term}</Text>
              <Text style={{ fontSize: 15, lineHeight: 22 }}>{t.meaning}</Text>
            </View>
          ))}
        </View>
      );
    case "template":
      return <Template title={block.title} body={block.body} />;
    default:
      return null;
  }
}

function CaseStudy({ block }: { block: Extract<LessonBlock, { type: "case" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.box, { padding: 0, overflow: "hidden" }]}>
      <View style={{ padding: space.lg, gap: space.sm }}>
        <Label>Case study</Label>
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 18, lineHeight: 24, color: colors.ink }}>{block.title}</Text>
        <Text style={{ fontSize: 16, lineHeight: 25 }}>{block.scenario}</Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 24, color: colors.ink }}>{block.question}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [{ flexDirection: "row", justifyContent: "space-between", padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }, pressed && { backgroundColor: colors.paper2 }]}>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink, flex: 1 }}>
          {open ? "Hide the discussion" : "Think it through, then see the discussion"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 18 }}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open && <Text style={{ fontSize: 16, lineHeight: 25, paddingHorizontal: space.lg, paddingBottom: space.lg }}>{block.discussion}</Text>}
    </View>
  );
}

function Template({ title, body }: { title: string; body: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <View style={[styles.box, { gap: space.md }]}>
      <Label>Template</Label>
      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.ink }}>{title}</Text>
      <Text selectable style={{ fontSize: 14, lineHeight: 21, color: colors.ink2, backgroundColor: colors.paper, padding: space.md, borderRadius: radius.sm }}>
        {body}
      </Text>
      <Button
        title={copied ? "Copied" : "Copy the template"}
        icon={copied ? Check : Copy}
        variant="secondary"
        size="sm"
        onPress={async () => {
          await Clipboard.setStringAsync(body);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  number: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.rule, alignItems: "center", justifyContent: "center" },
  cell: { width: 180, paddingVertical: space.md, paddingRight: space.lg, fontSize: 15, lineHeight: 22, color: colors.ink2 },
});
