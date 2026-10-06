import { Pressable, StyleSheet, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import type { Question } from "./types";

type Marking = { answer?: number; wrong?: boolean };

/**
 * A multiple-choice question: the prompt and its options as radio buttons.
 * After marking, the right answer is shown in green and a wrong pick in red.
 */
export function QuestionOptions({
  question,
  number,
  chosen,
  onChoose,
  disabled,
  marking,
  flag,
}: {
  question: Question;
  number: number;
  chosen: number | undefined;
  onChoose: (i: number) => void;
  disabled?: boolean;
  marking?: Marking | null;
  /** Shown beside the prompt after marking: true for correct, false for "needs another look". */
  flag?: boolean | null;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
        <Text style={{ flex: 1, fontFamily: fonts.sansMedium, color: colors.ink }}>
          <Text style={{ color: colors.muted }}>{number}. </Text>
          {question.prompt}
        </Text>
        {flag === true && <Check size={20} color={colors.positive} strokeWidth={1.75} accessibilityLabel="Correct" />}
        {flag === false && <X size={20} color={colors.destructive} strokeWidth={1.75} accessibilityLabel="Needs another look" />}
      </View>
      <View accessibilityRole="radiogroup" style={{ gap: space.sm }}>
        {question.options.map((option, i) => {
          const picked = chosen === i;
          const isAnswer = marking?.answer === i;
          const wrongPick = !!marking && picked && marking.wrong;
          const faded = !!marking && !picked && !isAnswer;
          return (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityState={{ checked: picked, disabled }}
              disabled={disabled}
              onPress={() => onChoose(i)}
              style={({ pressed }) => [
                styles.option,
                picked && styles.picked,
                isAnswer && styles.answer,
                wrongPick && styles.wrong,
                faded && { opacity: 0.6 },
                pressed && { backgroundColor: colors.paper2 },
              ]}>
              <View style={[styles.dot, picked && styles.dotOn]}>
                {isAnswer ? <Check size={11} color={picked ? colors.onInk : colors.positive} strokeWidth={2.5} /> : wrongPick ? <X size={11} color={colors.onInk} strokeWidth={2.5} /> : null}
              </View>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink }}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.card,
  },
  picked: { borderColor: colors.ink, backgroundColor: colors.paper2 },
  answer: { borderColor: colors.positive, backgroundColor: "#e3ece6" },
  wrong: { borderColor: "#d9a59e", backgroundColor: "#f6e9e7" },
  dot: { marginTop: 2, width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: colors.input, alignItems: "center", justifyContent: "center" },
  dotOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
