import { Alert, Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import {
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  CreditCard,
  Gift,
  GraduationCap,
  HeartHandshake,
  Newspaper,
  Settings,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import { Avatar, Button, Card, Heading, Label, Muted, Rule, Screen, Small, Text , CountDot } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useMe } from "@/lib/me";
import { colors, space } from "@/theme";

type Item = { href: Href; label: string; icon: LucideIcon; show?: boolean; count?: number };

export default function MeTab() {
  const { data: me, refetch, isRefetching } = useMe();
  const { signOut } = useAuth();
  const access = me?.access;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Learn",
      items: [
        { href: "/learn", label: "Learn", icon: BookOpen },
        { href: "/courses", label: "Courses", icon: GraduationCap },
        { href: "/trichozette", label: "Trichozette", icon: Newspaper },
        { href: "/assistant", label: "Assistant", icon: Sparkles, show: !!access?.professional },
      ],
    },
    {
      title: "Membership",
      items: [
        { href: "/perks", label: "Member perks", icon: Gift },
        { href: "/referrals", label: "Client referrals", icon: HeartHandshake, show: !!access?.professional, count: me?.counts.referrals },
        { href: "/refer", label: "Invite colleagues", icon: UserPlus },
        { href: "/business", label: "Your business", icon: Briefcase, show: !!access?.business },
        { href: "/membership", label: "Membership and billing", icon: CreditCard },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/profile", label: "Your profile", icon: Settings },
        { href: "/profile/verification", label: "Verification", icon: Award, show: !!access?.professional },
      ],
    },
  ];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Pressable onPress={() => router.push("/profile")} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Avatar name={me?.user?.name} image={me?.user?.image} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Heading>{me?.user?.name ?? "Your profile"}</Heading>
          <Small>{me?.membership.isActive ? `${me.membership.tierName} member` : "Free account"}</Small>
        </View>
      </Pressable>

      {me && !me.membership.isActive && (
        <Card style={{ gap: space.md }}>
          <Heading>Join colleagues across every discipline of hair and scalp care.</Heading>
          <Muted>Members ask questions in every space, learn at a live masterclass each month and pay less for courses and conferences.</Muted>
          <Button title="See membership" onPress={() => router.push("/membership")} />
        </Card>
      )}

      {groups.map((g) => (
        <View key={g.title} style={{ gap: space.sm }}>
          <Label>{g.title}</Label>
          <Card style={{ padding: 0 }}>
            {g.items
              .filter((i) => i.show !== false)
              .map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <Rule style={{ marginLeft: 52 }} />}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(item.href)}
                    style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }, pressed && { backgroundColor: colors.paper2 }]}>
                    <View>
                      <item.icon size={20} color={colors.ink} strokeWidth={1.75} />
                      <CountDot count={item.count ?? 0} />
                    </View>
                    <Text style={{ flex: 1, color: colors.ink }}>{item.label}</Text>
                    <ChevronRight size={18} color={colors.mute} />
                  </Pressable>
                </View>
              ))}
          </Card>
        </View>
      ))}

      <Button
        title="Sign out"
        variant="secondary"
        full
        onPress={() =>
          Alert.alert("Sign out of Trichollective on this phone?", undefined, [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: signOut },
          ])
        }
      />
    </Screen>
  );
}
