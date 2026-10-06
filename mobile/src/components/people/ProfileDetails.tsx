import type { ReactNode } from "react";
import { Linking, Pressable, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Globe, Phone } from "lucide-react-native";
import { Label, Text } from "@/components/ui";
import { colors, fonts, radius, space } from "@/theme";
import type { MemberProfile } from "./types";

/** A labelled part of a profile, like the website's definition list. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      {children}
    </View>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((i) => (
        <View key={i} style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.paper2, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, color: colors.ink2 }}>{i}</Text>
        </View>
      ))}
    </View>
  );
}

function ContactLink({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {icon}
      <Text style={{ color: colors.ink, textDecorationLine: "underline", fontFamily: fonts.sansMedium }}>{label}</Text>
    </Pressable>
  );
}

/** Specialisms, services, experience, courses, qualifications, memberships and contact details, as the member chose to share them. */
export function ProfileDetails({ profile: p }: { profile: MemberProfile }) {
  const { contact } = p;
  const hasContact = !!(contact.website || contact.socials.length || contact.phone || contact.address);
  return (
    <View style={{ gap: space.lg }}>
      {p.specialisms.length > 0 && (
        <Detail label="Specialisms">
          <Chips items={p.specialisms} />
        </Detail>
      )}
      {p.services.length > 0 && (
        <Detail label="Services">
          <Chips items={p.services} />
        </Detail>
      )}
      {p.yearsInPractice != null && p.yearsInPractice > 0 && (
        <Detail label="Experience">
          <Text>
            {p.yearsInPractice} {p.yearsInPractice === 1 ? "year" : "years"} in practice
          </Text>
        </Detail>
      )}
      {p.badges.length > 0 && (
        <Detail label="Courses completed">
          <Chips items={p.badges.map((b) => b.courseTitle)} />
        </Detail>
      )}
      {p.qualifications.length > 0 && (
        <Detail label="Qualifications">
          <View style={{ gap: 4 }}>
            {p.qualifications.map((q, i) => (
              <Text key={i}>
                {q.title}
                {q.body ? `, ${q.body}` : ""}
                {q.year ? <Text style={{ color: colors.muted }}> ({q.year})</Text> : null}
              </Text>
            ))}
          </View>
        </Detail>
      )}
      {p.memberships.length > 0 && (
        <Detail label="Memberships">
          <Text>{p.memberships.join(", ")}</Text>
        </Detail>
      )}
      {hasContact && (
        <Detail label="Contact">
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 8 }}>
            {contact.website && (
              <ContactLink
                label="Website"
                icon={<Globe size={16} color={colors.ink} strokeWidth={1.75} />}
                onPress={() => WebBrowser.openBrowserAsync(contact.website!)}
              />
            )}
            {contact.socials.map((s) => (
              <ContactLink key={s.key} label={s.label} onPress={() => WebBrowser.openBrowserAsync(s.url)} />
            ))}
            {contact.phone && (
              <ContactLink
                label={contact.phone}
                icon={<Phone size={16} color={colors.ink} strokeWidth={1.75} />}
                onPress={() => Linking.openURL(`tel:${contact.phone!.replace(/[^\d+]/g, "")}`)}
              />
            )}
          </View>
          {contact.address && <Text selectable>{contact.address}</Text>}
        </Detail>
      )}
    </View>
  );
}
