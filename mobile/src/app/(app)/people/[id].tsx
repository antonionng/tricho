import { Pressable, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowUpRight, BadgeCheck, HeartHandshake, MapPin, MessageCircle } from "lucide-react-native";
import { Avatar, Badge, Button, Card, Empty, ErrorState, Label, Loading, Muted, Screen, Small, Text, Title } from "@/components/ui";
import { useMessageMember } from "@/components/messages/hooks";
import { shortName } from "@/components/messages/format";
import { FollowButton } from "@/components/people/FollowButton";
import { PostRow } from "@/components/people/PostRow";
import { ProfileDetails } from "@/components/people/ProfileDetails";
import type { MemberProfile } from "@/components/people/types";
import { api, webUrl } from "@/lib/api";
import { queryClient } from "@/lib/query";
import { colors, space } from "@/theme";

/** A member's profile: who they are, what they do, and their recent posts. */
export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = ["people", "profile", id];
  const profile = useQuery({ queryKey: key, queryFn: () => api<MemberProfile>(`people/${id}`), enabled: !!id });
  const message = useMessageMember();

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={profile.refetch} />;
  const p = profile.data;

  const setFollowing = (following: boolean) => {
    queryClient.setQueryData<MemberProfile>(key, (d) =>
      d ? { ...d, following, counts: { ...d.counts, followers: d.counts.followers + (following === d.following ? 0 : following ? 1 : -1) } } : d
    );
    // Keep the directory in step.
    queryClient.invalidateQueries({ queryKey: ["people", "list"] });
  };
  const line = [p.practiceName, p.place].filter(Boolean).join(" · ");

  return (
    <Screen refreshing={profile.isRefetching} onRefresh={profile.refetch}>
      <Stack.Screen options={{ title: p.name || "Member" }} />

      <Card style={{ gap: space.lg }}>
        <View style={{ flexDirection: "row", gap: space.lg, alignItems: "flex-start" }}>
          <Avatar name={p.name} image={p.image} size={76} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Title style={{ flexShrink: 1 }}>{p.name || "Member"}</Title>
              {p.verified && <BadgeCheck size={22} color={colors.positive} strokeWidth={1.75} accessibilityLabel="Verified" />}
            </View>
            {p.headline ? <Text>{p.headline}</Text> : null}
            {line ? <Small>{line}</Small> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {p.discipline && <Badge label={p.discipline.label} />}
              {p.isFounding && <Badge label="Founding member" tone="ink" />}
              {p.chapter && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${p.chapter.city} chapter`}
                  onPress={() => router.push(`/chapters/${p.chapter!.slug}`)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.paper2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <MapPin size={12} color={colors.ink2} strokeWidth={1.75} />
                  <Small style={{ color: colors.ink2, fontSize: 12 }}>{p.chapter.city}</Small>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {p.bio ? <Text selectable>{p.bio}</Text> : null}

        <ProfileDetails profile={p} />

        <Muted>
          {p.counts.followers} {p.counts.followers === 1 ? "follower" : "followers"} · following {p.counts.following}
        </Muted>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {p.isMe ? (
            <Button title="Edit your profile" onPress={() => router.push("/profile")} />
          ) : (
            <>
              <FollowButton userId={p.id} following={p.following} onChange={setFollowing} size="md" />
              <Button title="Message" icon={MessageCircle} variant="secondary" loading={message.isPending} onPress={() => message.mutate(p.id)} />
              {p.canRefer && (
                <Button title="Refer a client" icon={HeartHandshake} variant="secondary" onPress={() => router.push(`/referrals/new?to=${p.id}`)} />
              )}
            </>
          )}
          {p.publicPath && (
            <Button title="Public profile" icon={ArrowUpRight} variant="ghost" onPress={() => WebBrowser.openBrowserAsync(webUrl(p.publicPath!))} />
          )}
        </View>
      </Card>

      <View style={{ gap: space.md }}>
        <Label>Recent posts</Label>
        {p.posts.length === 0 ? (
          <Empty
            title={p.isMe ? "You haven't posted yet." : `${shortName(p.name, "This member")} hasn't posted yet.`}
            body={p.isMe ? "Introductions is a good place to start." : "Their posts will appear here when they do."}
          />
        ) : (
          p.posts.map((post) => <PostRow key={post.id} post={post} />)
        )}
      </View>
    </Screen>
  );
}
