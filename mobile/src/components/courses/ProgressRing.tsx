import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text } from "@/components/ui";
import { colors, fonts } from "@/theme";

/** A learner's progress through a course, as a ring with the percentage inside. */
export function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const stroke = Math.max(3, size / 14);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, percent));
  return (
    <View accessibilityLabel={`${value}% complete`} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.rule} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.ink}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - value / 100)}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontFamily: fonts.sansSemibold, fontSize: Math.max(11, size / 4.2), color: colors.ink }}>{value}%</Text>
    </View>
  );
}
