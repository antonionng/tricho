import { View } from "react-native";
import { Avatar, Small } from "@/components/ui";
import { colors } from "@/theme";
import type { Face } from "./types";

/** Overlapping faces of the first few members going, then the sentence the website shows. */
export function AttendeeFaces({ attendees, text }: { attendees: Face[]; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {attendees.length > 0 && (
        <View style={{ flexDirection: "row" }}>
          {attendees.map((a, i) => (
            <View key={a.id} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: 16, borderWidth: 2, borderColor: colors.card }}>
              <Avatar name={a.name} image={a.image} size={26} />
            </View>
          ))}
        </View>
      )}
      <Small style={{ flex: 1 }}>{text}</Small>
    </View>
  );
}
