import { View } from "react-native";
import { router } from "expo-router";
import { BadgeCheck, MessageCircle } from "lucide-react-native";
import { Avatar, Button, PressableCard, Small, Text } from "@/components/ui";
import { useMessageMember } from "@/components/messages/hooks";
import { colors, fonts, space } from "@/theme";
import { FollowButton } from "./FollowButton";
import type { PersonSummary } from "./types";

/** A member in the directory, with Follow and Message. */
export function PersonRow({ person, onFollowChange }: { person: PersonSummary; onFollowChange: (following: boolean) => void }) {
  const message = useMessageMember();
  return (
    <PressableCard onPress={() => router.push(`/people/${person.id}`)} accessibilityLabel={`${person.name || "Member"}. ${person.subtitle}`} style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Avatar name={person.name} image={person.image} size={48} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.sansSemibold, color: colors.ink }}>
              {person.name || "Member"}
            </Text>
            {person.verified && <BadgeCheck size={16} color={colors.positive} strokeWidth={1.75} accessibilityLabel="Verified" />}
          </View>
          <Small numberOfLines={1}>{person.subtitle}</Small>
        </View>
      </View>
      {person.isMe ? (
        <Small>This is you.</Small>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <FollowButton userId={person.id} following={person.following} onChange={onFollowChange} />
          <Button title="Message" icon={MessageCircle} variant="secondary" size="sm" loading={message.isPending} onPress={() => message.mutate(person.id)} />
        </View>
      )}
    </PressableCard>
  );
}
