import { useState } from "react";
import { Alert, Switch, View } from "react-native";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, X } from "lucide-react-native";
import { Avatar, Button, Card, ErrorState, Input, Loading, Muted, Rule, Screen, Section, Small, Text } from "@/components/ui";
import { Notice } from "@/components/referrals/Notice";
import type { ActionResult, BusinessDashboard, Seat } from "@/components/business/types";
import { api } from "@/lib/api";
import { colors, fonts, space } from "@/theme";

const dashboardKey = ["business", "dashboard"] as const;

function SeatEditor({ seat, onSaved }: { seat: Seat; onSaved: (message: string | null) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(seat.name ?? "");
  const [role, setRole] = useState(seat.role ?? "");
  const [bio, setBio] = useState(seat.bio ?? "");
  const [showOnPage, setShowOnPage] = useState(seat.showOnPage);
  const save = useMutation({
    mutationFn: () => api<ActionResult>(`business/seats/${seat.id}`, { method: "PATCH", body: { name, role, bio, showOnPage } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["business"] });
      onSaved(r.message);
    },
  });
  return (
    <View style={{ gap: space.md, paddingTop: space.sm }}>
      <Input label="Name" value={name} onChangeText={setName} maxLength={80} placeholder="Their full name" />
      <Input label="Role" value={role} onChangeText={setRole} maxLength={80} placeholder="For example, Senior trichologist" />
      <Input
        label="About them"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={600}
        placeholder="Two or three sentences on their training, what they specialise in and who they help."
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Text style={{ flex: 1, color: colors.ink }}>Show them in “Meet the team” on our business page.</Text>
        <Switch value={showOnPage} onValueChange={setShowOnPage} trackColor={{ true: colors.ink }} accessibilityLabel="Show them on our business page" />
      </View>
      <Small>Their photo is added on the website.</Small>
      {save.error && <Notice tone="error">{save.error.message}</Notice>}
      <Button title="Save their details" size="sm" loading={save.isPending} onPress={() => save.mutate()} />
    </View>
  );
}

/** The business's Professional seats: who has one, adding a colleague and freeing a seat. */
export default function TeamScreen() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: dashboardKey, queryFn: () => api<BusinessDashboard>("business") });
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "positive" | "error"; text: string } | null>(null);

  const done = (r: ActionResult) => {
    qc.invalidateQueries({ queryKey: ["business"] });
    if (r.message) setNotice({ tone: "positive", text: r.message });
  };
  const add = useMutation({
    mutationFn: () => api<ActionResult>("business/seats", { body: { email: email.trim() } }),
    onSuccess: (r) => {
      setEmail("");
      done(r);
    },
    onError: (e) => setNotice({ tone: "error", text: e.message }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api<ActionResult>(`business/seats/${id}`, { method: "DELETE" }),
    onSuccess: done,
    onError: (e) => setNotice({ tone: "error", text: e.message }),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const { seats, business } = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Team seats" }} />
      <Muted>
        {`Give up to ${seats.limit} people on your team Professional membership, paid for by your plan. They sign in with the email you add here. Add a name and role to introduce them in “Meet the team” on your business page.`}
      </Muted>
      {!business && <Notice tone="error">Seats only work while your Business plan is active.</Notice>}
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Section title={`Your team: ${seats.used} of ${seats.limit} seats used`}>
        {seats.list.length > 0 && (
          <Card style={{ padding: 0 }}>
            {seats.list.map((seat, i) => (
              <View key={seat.id}>
                {i > 0 && <Rule />}
                <View style={{ padding: space.lg, gap: space.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <Avatar name={seat.name || seat.email} image={seat.photoUrl} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: colors.ink }}>
                        {seat.name || seat.email}
                      </Text>
                      <Small numberOfLines={1}>
                        {seat.name
                          ? `${seat.role ? `${seat.role} · ` : ""}${seat.email}`
                          : `Added ${new Date(seat.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      </Small>
                    </View>
                    <Button
                      title="Remove"
                      size="sm"
                      variant="secondary"
                      icon={X}
                      accessibilityLabel={`Remove ${seat.email}`}
                      loading={remove.isPending && remove.variables === seat.id}
                      onPress={() =>
                        Alert.alert(`Remove ${seat.name || seat.email} from your team?`, "Their Professional membership through your plan ends, and the seat is free again.", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => remove.mutate(seat.id) },
                        ])
                      }
                    />
                  </View>
                  <Button
                    title={seat.name ? "Edit how they appear on your page" : "Introduce them on your page"}
                    variant="ghost"
                    size="sm"
                    icon={open === seat.id ? ChevronUp : ChevronDown}
                    style={{ paddingHorizontal: 0 }}
                    onPress={() => setOpen(open === seat.id ? null : seat.id)}
                  />
                  {open === seat.id && (
                    <SeatEditor
                      seat={seat}
                      onSaved={(message) => {
                        setOpen(null);
                        if (message) setNotice({ tone: "positive", text: message });
                      }}
                    />
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {seats.used < seats.limit ? (
          <Card style={{ gap: space.md }}>
            <Input
              label="Team member's email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={160}
              placeholder="colleague@yourbusiness.com"
              hint="We email them to say their Professional membership is ready."
            />
            <Button title="Add to my team" loading={add.isPending} disabled={!email.includes("@")} onPress={() => add.mutate()} />
          </Card>
        ) : (
          <Text style={{ fontFamily: fonts.sans, color: colors.muted }}>{`All ${seats.limit} seats are in use. Remove someone to add a new team member.`}</Text>
        )}
      </Section>
    </Screen>
  );
}
