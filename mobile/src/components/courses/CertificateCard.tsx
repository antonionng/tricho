import { Platform, StyleSheet, View } from "react-native";
import { Award } from "lucide-react-native";
import { Label, Small, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import { longDate } from "./types";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

/** An issued certificate of completion, in the same design as the website's. */
export function CertificateCard({
  holderName,
  courseTitle,
  hours,
  issuedAt,
  reviewer,
  url,
  withdrawn,
}: {
  holderName: string;
  courseTitle: string;
  hours: number;
  issuedAt: string;
  reviewer: string | null;
  url: string;
  withdrawn: boolean;
}) {
  const host = url.replace(/^https?:\/\//, "");
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.lg }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.6, color: colors.ink }}>Trichollective</Text>
            <Label>Certificate of completion</Label>
          </View>
          <View style={[styles.seal, withdrawn && { borderColor: colors.destructive }]}>
            <Award size={26} color={withdrawn ? colors.destructive : colors.ink} strokeWidth={1.3} />
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <Small>This is to confirm that</Small>
          <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 34, letterSpacing: -1, color: colors.ink }}>{holderName}</Text>
          <Small>has completed the online course</Small>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 19, lineHeight: 25, color: colors.ink }}>{courseTitle}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.lg }}>
          <Field label="Study time" value={`${hours} hours`} />
          <Field label="Completed" value={longDate(issuedAt)} />
          {reviewer && <Field label="Course reviewed by" value={reviewer} wide />}
          <Field label="Check this certificate" value={host} wide mono />
        </View>
        <Small>A certificate of completion for continuing professional development. It is not an accredited qualification.</Small>
      </View>
      {withdrawn && (
        <View style={styles.withdrawn}>
          <Text style={{ fontFamily: fonts.sansSemibold, fontSize: 20, letterSpacing: 2, color: colors.destructive, transform: [{ rotate: "-6deg" }], borderWidth: 2, borderColor: colors.destructive, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 6 }}>
            WITHDRAWN
          </Text>
        </View>
      )}
    </View>
  );
}

function Field({ label, value, wide, mono }: { label: string; value: string; wide?: boolean; mono?: boolean }) {
  return (
    <View style={{ width: wide ? "100%" : "50%", gap: 4 }}>
      <Label>{label}</Label>
      <Text selectable style={{ fontSize: mono ? 13 : 14, color: mono ? colors.ink2 : colors.ink, fontFamily: mono ? MONO : fonts.sans }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, borderRadius: radius.xxl, backgroundColor: colors.card, padding: 6 },
  inner: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, borderRadius: radius.xl, padding: space.xl, gap: space.xl },
  seal: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  withdrawn: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(244,243,240,0.7)", alignItems: "center", justifyContent: "center", borderRadius: radius.xxl },
});
