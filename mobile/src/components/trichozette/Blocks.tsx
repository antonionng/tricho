import { useState } from "react";
import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui";
import { fonts, space } from "@/theme";
import { mag, type Block } from "./types";

const LETTERS = ["i.", "ii.", "iii.", "iv.", "v.", "vi."];

const body = { fontFamily: fonts.sans, fontSize: 16.5, lineHeight: 27, color: "rgba(11,11,11,0.86)" };
const caps = { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2.4, textTransform: "uppercase" as const, color: mag.soft };
const ruleY = { borderTopWidth: 1, borderBottomWidth: 1, borderColor: mag.ink, paddingVertical: space.lg, marginVertical: space.md };

function Quiz({ block }: { block: Extract<Block, { type: "quiz" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <View style={ruleY}>
      <Text style={caps}>Test yourself</Text>
      <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 22, lineHeight: 26, color: mag.ink, marginTop: space.sm }}>{block.question}</Text>
      <View style={{ marginTop: space.md }}>
        {block.options.map((o, i) => {
          const correct = i === block.answer;
          return (
            <Pressable
              key={o}
              disabled={done}
              accessibilityRole="button"
              accessibilityState={{ disabled: done, selected: picked === i }}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPicked(i);
              }}
              style={{ flexDirection: "row", gap: 12, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderColor: mag.faint }}>
              <Text style={{ fontFamily: fonts.didoneItalic, width: 28, fontSize: 16, color: mag.soft }}>{LETTERS[i] ?? `${i + 1}.`}</Text>
              <Text
                style={[
                  { ...body, flex: 1, fontSize: 15.5, lineHeight: 22 },
                  done && !correct && { color: "rgba(11,11,11,0.35)", textDecorationLine: "line-through" },
                  done && correct && { fontFamily: fonts.sansSemibold, color: mag.ink },
                ]}>
                {o}
              </Text>
              {done && correct && <Text style={{ ...caps, color: mag.ink, alignSelf: "center" }}>Answer</Text>}
            </Pressable>
          );
        })}
      </View>
      {done && (
        <View style={{ marginTop: space.sm, gap: space.sm }} accessibilityLiveRegion="polite">
          <Text style={{ ...body, fontSize: 15, lineHeight: 23 }}>
            <Text style={{ fontFamily: fonts.didoneItalic, color: mag.ink }}>{picked === block.answer ? "Quite right. " : "Not quite. "}</Text>
            {block.explain}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setPicked(null)} hitSlop={8}>
            <Text style={{ ...caps, textDecorationLine: "underline" }}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Checklist({ block }: { block: Extract<Block, { type: "checklist" }> }) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    Haptics.selectionAsync().catch(() => {});
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  return (
    <View style={ruleY}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.md }}>
        <Text style={{ flex: 1, fontFamily: fonts.didoneItalic, fontSize: 21, lineHeight: 25, color: mag.ink }}>{block.title}</Text>
        <Text style={caps}>
          {ticked.size} of {block.items.length}
        </Text>
      </View>
      <View style={{ marginTop: space.sm }}>
        {block.items.map((item, i) => {
          const on = ticked.has(i);
          return (
            <Pressable
              key={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(i)}
              style={{ flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "flex-start", borderTopWidth: i === 0 ? 0 : 1, borderColor: mag.faint }}>
              <Text style={{ fontFamily: fonts.didone, width: 26, fontSize: 18, lineHeight: 22, color: mag.ink }}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={[{ ...body, flex: 1, fontSize: 15.5, lineHeight: 22 }, on && { color: "rgba(11,11,11,0.35)", textDecorationLine: "line-through" }]}>{item}</Text>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: mag.ink, backgroundColor: on ? mag.ink : "transparent", marginTop: 4 }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Reveal({ block }: { block: Extract<Block, { type: "reveal" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderLeftWidth: 1, borderColor: mag.ink, paddingLeft: space.lg, marginVertical: space.sm }}>
      <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 19, lineHeight: 25, color: mag.ink }}>{block.prompt}</Text>
      {open ? (
        <Text style={{ ...body, fontSize: 15, lineHeight: 23, marginTop: space.sm }} accessibilityLiveRegion="polite">
          {block.answer}
        </Text>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} hitSlop={8} style={{ marginTop: space.sm }}>
          <Text style={{ ...caps, color: mag.ink, textDecorationLine: "underline" }}>Reveal the answer</Text>
        </Pressable>
      )}
    </View>
  );
}

/** One block, magazine styled. `drop` gives the paragraph a Bodoni drop cap. */
export function BlockView({ block, drop, light }: { block: Block; drop?: boolean; light?: boolean }) {
  switch (block.type) {
    case "p":
      if (drop && block.text.length > 1) {
        return (
          <Text style={body} selectable>
            <Text style={{ fontFamily: fonts.didone, fontSize: 46, lineHeight: 46, color: mag.ink }}>{block.text[0]}</Text>
            {block.text.slice(1)}
          </Text>
        );
      }
      return (
        <Text style={[body, light && { color: "rgba(255,255,255,0.9)" }]} selectable>
          {block.text}
        </Text>
      );
    case "h":
      return (
        <Text accessibilityRole="header" style={{ ...caps, fontFamily: fonts.sansSemibold, fontSize: 11, color: mag.ink, marginTop: space.md }}>
          {block.text}
        </Text>
      );
    case "list":
      return (
        <View style={{ gap: 8 }}>
          {block.items.map((it) => (
            <View key={it} style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ width: 10, height: 1, backgroundColor: mag.ink, marginTop: 13 }} />
              <Text style={{ ...body, flex: 1, fontSize: 16, lineHeight: 25 }}>{it}</Text>
            </View>
          ))}
        </View>
      );
    case "pull":
      return (
        <View style={{ alignItems: "center", marginVertical: space.lg }}>
          <Text style={{ fontFamily: fonts.didone, fontSize: 48, lineHeight: 34, color: mag.ink }}>{"“"}</Text>
          <Text style={{ fontFamily: fonts.didoneItalic, fontSize: 26, lineHeight: 30, color: mag.ink, textAlign: "center", marginTop: space.sm }}>{block.text}</Text>
          <View style={{ width: 40, height: 1, backgroundColor: mag.ink, marginTop: space.lg }} />
        </View>
      );
    case "callout":
      return (
        <View style={{ backgroundColor: mag.ink, paddingHorizontal: space.xl, paddingVertical: space.lg, marginVertical: space.sm }}>
          <Text style={{ ...caps, color: "rgba(255,255,255,0.6)" }}>{block.title}</Text>
          <Text style={{ ...body, fontSize: 15, lineHeight: 23, color: "rgba(255,255,255,0.9)", marginTop: space.sm }}>{block.text}</Text>
        </View>
      );
    case "checklist":
      return <Checklist block={block} />;
    case "quiz":
      return <Quiz block={block} />;
    case "reveal":
      return <Reveal block={block} />;
  }
}

/** A run of blocks, with an optional drop cap on the first paragraph. */
export function Blocks({ blocks, dropCap = false }: { blocks: Block[]; dropCap?: boolean }) {
  const capIndex = dropCap ? blocks.findIndex((b) => b.type === "p") : -1;
  return (
    <View style={{ gap: space.lg }}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} drop={i === capIndex} />
      ))}
    </View>
  );
}

export const magText = { body, caps };
