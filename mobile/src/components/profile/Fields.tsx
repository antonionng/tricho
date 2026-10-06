import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Check } from "lucide-react-native";
import { Input, Label, Small, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import { toggleIn, type Draft } from "./draft";
import type { Option, ProfileOptions } from "./types";

/**
 * Form fields shared by onboarding and the profile screen. They mirror the
 * website's ProfileFields, and edit a Draft that draft.ts turns into the
 * website's form fields.
 */

export type SetDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>{children}</Text>;
}

/** A pill that can be ticked, like the website's checkbox chips. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && { opacity: 0.75 }]}>
      {selected && <Check size={14} color={colors.ink} strokeWidth={1.75} />}
      <Text style={{ fontSize: 14, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ options, selected, onChange }: { options: Option[]; selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} selected={selected.includes(o.id)} onPress={() => onChange(toggleIn(selected, o.id))} />
      ))}
    </View>
  );
}

/** Pick one, shown as cards with an optional line of detail. */
export function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; detail?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={({ pressed }) => [styles.choice, on && styles.choiceOn, pressed && { opacity: 0.8 }]}>
            <View style={[styles.radio, on && { borderColor: colors.ink }]}>{on && <View style={styles.radioDot} />}</View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{o.label}</Text>
              {o.detail ? <Small>{o.detail}</Small> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A switch with a sentence beside it. */
export function ToggleRow({ title, detail, value, onChange }: { title: string; detail?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.ink }}>{title}</Text>
        {detail ? <Small>{detail}</Small> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.ink, false: colors.paper3 }} accessibilityLabel={title} />
    </View>
  );
}

type Props = { draft: Draft; set: SetDraft; options: ProfileOptions };

export function IdentityFields({ draft, set, options }: Props) {
  const countries = draft.country && !options.countries.includes(draft.country) ? [...options.countries, draft.country] : options.countries;
  return (
    <>
      <Input
        label="Headline"
        hint="One sentence about what you do and who you help."
        maxLength={140}
        value={draft.headline}
        onChangeText={(v) => set("headline", v)}
        placeholder="Trichologist helping women with shedding and thinning hair"
      />
      <Input
        label="Practice or clinic name"
        hint="Leave this empty if you work under your own name."
        maxLength={120}
        value={draft.practiceName}
        onChangeText={(v) => set("practiceName", v)}
      />
      <Input label="Town or city" maxLength={80} autoComplete="postal-address-locality" value={draft.city} onChangeText={(v) => set("city", v)} />
      <View style={{ gap: space.sm }}>
        <FieldLabel>Country</FieldLabel>
        <View style={styles.wrap}>
          {countries.map((c) => (
            <Chip key={c} label={c} selected={draft.country === c} onPress={() => set("country", draft.country === c ? "" : c)} />
          ))}
        </View>
      </View>
    </>
  );
}

export function PracticeFields({ draft, set, withBio = false }: Omit<Props, "options"> & { withBio?: boolean }) {
  return (
    <>
      {withBio && (
        <Input
          label="About your practice"
          hint="A short paragraph on how you work and the clients you see most often."
          multiline
          maxLength={800}
          value={draft.bio}
          onChangeText={(v) => set("bio", v)}
        />
      )}
      <Input
        label="Specialisms"
        hint="Separate each one with a comma, for example: Female pattern hair loss, Alopecia areata, Scalp conditions."
        value={draft.specialisms}
        onChangeText={(v) => set("specialisms", v)}
      />
      <Input
        label="Services"
        hint="Separate each one with a comma, for example: Scalp consultation, Trichoscopy, Head spa."
        value={draft.services}
        onChangeText={(v) => set("services", v)}
      />
      <Input
        label="Years in practice"
        keyboardType="number-pad"
        maxLength={2}
        value={draft.yearsInPractice}
        onChangeText={(v) => set("yearsInPractice", v.replace(/\D/g, ""))}
        style={{ maxWidth: 140 }}
      />
    </>
  );
}

export function QualificationFields({ draft, set, options }: Props) {
  const setRow = (i: number, key: "title" | "year", value: string) =>
    set(
      "quals",
      draft.quals.map((q, j) => (j === i ? { ...q, [key]: value } : q))
    );
  return (
    <>
      <View style={{ gap: space.sm }}>
        <FieldLabel>Qualifications and training</FieldLabel>
        {draft.quals.map((q, i) => (
          <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                accessibilityLabel={`Qualification ${i + 1}`}
                maxLength={140}
                value={q.title}
                placeholder={i === 0 ? "Diploma in Trichology" : ""}
                onChangeText={(v) => setRow(i, "title", v)}
              />
            </View>
            <View style={{ width: 96 }}>
              <Input
                accessibilityLabel={`Year of qualification ${i + 1}`}
                keyboardType="number-pad"
                maxLength={4}
                value={q.year}
                placeholder="Year"
                onChangeText={(v) => setRow(i, "year", v.replace(/\D/g, ""))}
              />
            </View>
          </View>
        ))}
        <Pressable accessibilityRole="button" onPress={() => set("quals", [...draft.quals, { title: "", year: "" }])} style={{ paddingVertical: 6 }}>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink, textDecorationLine: "underline" }}>Add another qualification</Text>
        </Pressable>
        <Small>Leave a row empty to remove it.</Small>
      </View>
      <View style={{ gap: space.sm }}>
        <FieldLabel>Professional memberships</FieldLabel>
        <ChipGroup options={options.membershipBodies} selected={draft.memberships} onChange={(v) => set("memberships", v)} />
      </View>
      <Input
        label="Other bodies or registrations"
        hint="Separate each one with a comma."
        value={draft.membershipsOther}
        onChangeText={(v) => set("membershipsOther", v)}
      />
    </>
  );
}

export function ContactFields({ draft, set, options }: Props) {
  return (
    <>
      <View style={styles.note}>
        <Small style={{ color: colors.ink2 }}>
          Your phone number and business address are private by default. They only appear on your public profile if you choose to show them
          below, and members of the public can always reach you through the enquiry form instead.
        </Small>
      </View>
      <Input label="Phone" keyboardType="phone-pad" autoComplete="tel" maxLength={40} value={draft.phone} onChangeText={(v) => set("phone", v)} />
      <Input
        label="Website"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="yourclinic.ie"
        value={draft.website}
        onChangeText={(v) => set("website", v)}
      />
      <Label>Social profiles</Label>
      {options.socials.map((s) => (
        <Input
          key={s.key}
          label={s.label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="@handle or link"
          value={draft.socials[s.key] ?? ""}
          onChangeText={(v) => set("socials", { ...draft.socials, [s.key]: v })}
        />
      ))}
      <Label>Business address</Label>
      <Input label="Address line 1" autoComplete="address-line1" maxLength={120} value={draft.addressLine1} onChangeText={(v) => set("addressLine1", v)} />
      <Input label="Address line 2" autoComplete="address-line2" maxLength={120} value={draft.addressLine2} onChangeText={(v) => set("addressLine2", v)} />
      <Input
        label="Postcode or Eircode"
        autoComplete="postal-code"
        autoCapitalize="characters"
        maxLength={20}
        value={draft.postcode}
        onChangeText={(v) => set("postcode", v)}
        style={{ maxWidth: 200 }}
      />
      <ToggleRow title="Show my phone number on my public profile" value={draft.showPhone} onChange={(v) => set("showPhone", v)} />
      <ToggleRow title="Show my business address on my public profile" value={draft.showAddress} onChange={(v) => set("showAddress", v)} />
    </>
  );
}

export function GoalsFields({ draft, set, options }: Props) {
  return (
    <>
      <View style={{ gap: space.sm }}>
        <FieldLabel>What would you like from the community?</FieldLabel>
        <ChipGroup options={options.goals} selected={draft.goals} onChange={(v) => set("goals", v)} />
      </View>
      <View style={{ gap: space.md }}>
        <FieldLabel>Topics you want to follow</FieldLabel>
        {options.interestGroups.map((g) => (
          <View key={g.topic} style={{ gap: space.sm }}>
            <Label>{g.topic}</Label>
            <ChipGroup options={g.items} selected={draft.interests} onChange={(v) => set("interests", v)} />
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  chipOn: { borderColor: colors.ink, backgroundColor: colors.paper2 },
  choice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  choiceOn: { borderColor: colors.ink, backgroundColor: colors.paper2 },
  radio: { width: 20, height: 20, marginTop: 1, borderRadius: 10, borderWidth: 1.5, borderColor: colors.input, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  note: { backgroundColor: colors.paper2, borderRadius: radius.md, padding: space.md },
});
