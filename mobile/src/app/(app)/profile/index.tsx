import { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowUpRight, Award, BadgeCheck, ChevronRight } from "lucide-react-native";
import { Avatar, Badge, Button, Card, ErrorState, Heading, Input, Loading, Muted, Rule, Screen, Section, Small, Text, Title } from "@/components/ui";
import { api, webUrl } from "@/lib/api";
import { meKey } from "@/lib/me";
import { colors, fonts, radius, space } from "@/theme";
import { draftFrom, fieldsFor, type Draft, type FieldGroup } from "@/components/profile/draft";
import { ChoiceList, ContactFields, GoalsFields, IdentityFields, PracticeFields, QualificationFields, ToggleRow } from "@/components/profile/Fields";
import { PhotoField, multipart, type PickedImage } from "@/components/profile/photo";
import { SectionCard } from "@/components/profile/SectionCard";
import { profileKey, type ProfileResponse, type SaveResult } from "@/components/profile/types";

const openWeb = (path: string) => WebBrowser.openBrowserAsync(webUrl(path)).catch(() => {});

export default function ProfileScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: profileKey, queryFn: () => api<ProfileResponse>("profile") });
  const data = query.data;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [emails, setEmails] = useState({ updates: false, activity: false });
  const [photoBusy, setPhotoBusy] = useState(false);

  // Fill the forms once, from the first load; later refreshes keep what the member is typing.
  if (data && !draft) {
    setDraft(
      draftFrom(data.profile, {
        name: data.user.name,
        profession: data.profession,
        chapter: data.user.chapter?.slug ?? "",
        fallbackCity: data.user.chapter?.city,
        knownBodies: data.options.membershipBodies.map((b) => b.id),
      })
    );
    setEmails({ updates: data.emails.updates, activity: data.emails.activity });
  }

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d)), []);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: profileKey });
    qc.invalidateQueries({ queryKey: meKey });
  }, [qc]);

  const save = useCallback(
    async (section: string, groups: FieldGroup[]) => {
      if (!draft || !data) return null;
      const res = await api<SaveResult>("profile", {
        body: { section, ...fieldsFor(groups, draft, data.options.socials.map((s) => s.key)) },
      });
      refresh();
      return res.message;
    },
    [draft, data, refresh]
  );

  const uploadPhoto = useCallback(
    async (fields: Record<string, string>, photo?: PickedImage) => {
      setPhotoBusy(true);
      try {
        await api<SaveResult>("profile/photo", { body: multipart(fields, { photo }) });
        refresh();
      } catch (error) {
        Alert.alert("We couldn't save your photo.", error instanceof Error ? error.message : undefined);
      } finally {
        setPhotoBusy(false);
      }
    },
    [refresh]
  );

  if (query.isPending) return <Loading />;
  if (query.error || !data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!draft) return <Loading />;

  const { options } = data;
  const profession = options.professions.find((p) => p.id === data.profession);

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: "Your profile" }} />

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
        <Avatar name={data.user.name} image={data.photoUrl} size={72} />
        <View style={{ flex: 1, gap: space.sm }}>
          <Title numberOfLines={2}>{data.user.name || "Member"}</Title>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {data.plan && <Badge label={data.plan} />}
            {data.user.isFounding && <Badge label="Founding member" tone="ink" />}
            {profession && <Badge label={profession.label} />}
            {data.isVerified && <Badge label="Verified" tone="positive" />}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <Button title="How members see you" variant="secondary" size="sm" onPress={() => router.push(`/people/${data.user.id}`)} />
        {data.publicHref && (
          <Button title="View public profile" variant="secondary" size="sm" icon={ArrowUpRight} onPress={() => openWeb(data.publicHref!)} />
        )}
      </View>

      <Card style={{ gap: space.md }}>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>Your profile is {data.completeness.percent}% complete.</Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Profile completeness"
          accessibilityValue={{ min: 0, max: 100, now: data.completeness.percent }}
          style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.paper3, overflow: "hidden" }}>
          <View style={{ width: `${data.completeness.percent}%`, height: "100%", backgroundColor: colors.ink }} />
        </View>
        {data.completeness.missing.length > 0 && (
          <Small style={{ color: colors.ink2 }}>
            Adding {data.completeness.missing.slice(0, 3).join(", ")} will help colleagues and clients understand your work and refer to you with
            confidence.
          </Small>
        )}
      </Card>

      <LinkCard
        icon={<BadgeCheck size={24} color={colors.positive} strokeWidth={1.75} />}
        title={data.isVerified ? "Your credentials are verified." : "Get the verified badge on your profile."}
        body={
          data.isVerified
            ? "The verified badge shows on your member and directory profiles."
            : "Upload proof of your qualification and we will check it, so clients and colleagues know your credentials are confirmed."
        }
        onPress={() => router.push("/profile/verification")}
      />

      <Section title="Courses completed">
        {data.certificates.length === 0 ? (
          <LinkCard
            icon={<Award size={24} color={colors.ink} strokeWidth={1.75} />}
            title="Complete a course to add a badge to your profile."
            body="Each course you finish shows on your member and directory profiles, linked to a certificate anyone can check."
            onPress={() => router.push("/learn")}
          />
        ) : (
          <Card style={{ padding: 0 }}>
            {data.certificates.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Rule />}
                <CertificateRow certificate={c} onChange={refresh} />
              </View>
            ))}
          </Card>
        )}
      </Section>

      <SectionCard title="About you" onSave={() => save("about", ["about"])}>
        <Input label="Name" autoComplete="name" textContentType="name" maxLength={80} value={draft.name} onChangeText={(v) => set("name", v)} />
        <View style={{ gap: space.sm }}>
          <Small style={{ fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 }}>Discipline</Small>
          <ChoiceList
            options={options.professions.map((p) => ({ id: p.id, label: p.label, detail: p.blurb }))}
            value={draft.profession}
            onChange={(v) => set("profession", v)}
          />
        </View>
        <View style={{ gap: space.sm }}>
          <Small style={{ fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 14 }}>Chapter</Small>
          <ChoiceList
            options={[...options.chapters.map((c) => ({ id: c.slug, label: c.city })), { id: "none", label: "None near me yet" }]}
            value={draft.chapter || "none"}
            onChange={(v) => set("chapter", v)}
          />
        </View>
      </SectionCard>

      <SectionCard title="Photo">
        <PhotoField
          name={data.user.name}
          url={data.photoUrl}
          busy={photoBusy}
          onPick={(photo) => uploadPhoto({}, photo)}
          onRemove={() =>
            Alert.alert("Remove your photo?", "Your initials will show in its place until you add a new one.", [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => uploadPhoto({ removePhoto: "on" }) },
            ])
          }
        />
      </SectionCard>

      <SectionCard title="Practice" saveLabel="Save practice details" onSave={() => save("practice", ["identity", "bio", "practice"])}>
        <IdentityFields draft={draft} set={set} options={options} />
        <PracticeFields draft={draft} set={set} withBio />
        {!data.fullProfile && (
          <Small>
            These details are saved to your member profile straight away. Your headline, photo, services and website appear in the public
            directory while you have a full profile.
          </Small>
        )}
      </SectionCard>

      <SectionCard title="Qualifications and memberships" saveLabel="Save qualifications" onSave={() => save("qualifications", ["qualifications"])}>
        <QualificationFields draft={draft} set={set} options={options} />
      </SectionCard>

      <SectionCard title="Contact and address" saveLabel="Save contact details" onSave={() => save("contact", ["contact"])}>
        <ContactFields draft={draft} set={set} options={options} />
      </SectionCard>

      <SectionCard
        title="Goals and interests"
        saveLabel="Save goals and interests"
        intro={<Small style={{ color: colors.ink2 }}>Only you can see these. We use them to suggest people, discussions and learning that match what you want.</Small>}
        onSave={() => save("goals", ["goals"])}>
        <GoalsFields draft={draft} set={set} options={options} />
      </SectionCard>

      {data.fullProfile ? (
        <SectionCard title="Directory profile">
          <Muted>
            Your directory listing is filled from the profile above, including your photo, headline, practice, specialisms, services,
            qualifications and website. Your phone number and address stay private unless you choose to show them in Contact and address.
          </Muted>
          {data.listing && (
            <Text>
              {data.listing.status === "listed"
                ? "Your listing is live in the directory."
                : data.listing.status === "pending"
                  ? "Your listing is waiting for a quick check by our team before it goes live."
                  : "Your listing is not public yet. Publishing sends it to the directory."}
              {data.listing.trialDaysLeft > 0 ? ` Your full profile is included for another ${data.listing.trialDaysLeft} days.` : ""}
            </Text>
          )}
          <Text>
            {data.enquiries === 0
              ? "No enquiries yet. A clear headline, a list of services and a photo make it easier for people to reach out."
              : `You have ${data.enquiries} ${data.enquiries === 1 ? "enquiry" : "enquiries"} from your directory listing.`}
          </Text>
          <Small>You can publish your listing, add a cover photo and photos of your practice, and read enquiries on trichollective.net.</Small>
          <Button title="Manage your directory profile" variant="secondary" icon={ArrowUpRight} onPress={() => openWeb("/members/profile#listing")} />
        </SectionCard>
      ) : (
        <Card style={{ gap: space.md }}>
          <Heading>Professional lets clients find you, and sends their enquiries straight to you.</Heading>
          <Muted>
            Professional turns your listing into a full profile with your photo, services and website, and adds the Case Room, the referral
            network and the Assistant.
          </Muted>
          {data.heldEnquiries > 0 && (
            <Text>
              {data.heldEnquiries} {data.heldEnquiries === 1 ? "enquiry is" : "enquiries are"} waiting for your listing. They are held until you
              join the Professional plan.
            </Text>
          )}
          <Button title="See membership" onPress={() => router.push("/membership")} />
        </Card>
      )}

      <SectionCard
        title="Email preferences"
        saveLabel="Save email preferences"
        onSave={async () => {
          const res = await api<SaveResult>("profile/emails", { body: emails });
          refresh();
          return res.message;
        }}>
        <ToggleRow
          title="News and new releases"
          detail="The monthly newsletter, and an email when a new Trichozette edition, course or event is released."
          value={emails.updates}
          onChange={(updates) => setEmails((e) => ({ ...e, updates }))}
        />
        <ToggleRow
          title="Replies and messages"
          detail="An email when someone replies to your post or sends you a private message. You'll always see them in the app."
          value={emails.activity}
          onChange={(activity) => setEmails((e) => ({ ...e, activity }))}
        />
        <Small>Emails about your account, event bookings and payments are always sent to {data.emails.address ?? "your email address"}.</Small>
      </SectionCard>
    </Screen>
  );
}

function LinkCard({ icon, title, body, onPress }: { icon: React.ReactNode; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: space.lg, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.rule },
        { backgroundColor: pressed ? colors.paper2 : colors.card },
      ]}>
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{title}</Text>
        <Small>{body}</Small>
      </View>
      <ChevronRight size={18} color={colors.mute} strokeWidth={1.75} />
    </Pressable>
  );
}

function CertificateRow({ certificate: c, onChange }: { certificate: ProfileResponse["certificates"][number]; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
        <Award size={16} color={colors.onInk} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{c.courseTitle}</Text>
        <Small>
          {c.hours} hours CPD · {c.showOnProfile ? "Showing on your profile" : "Hidden from your profile"}
        </Small>
      </View>
      <Button
        title={c.showOnProfile ? "Hide badge" : "Show badge"}
        variant="secondary"
        size="sm"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await api("profile/certificates", { body: { id: c.id, show: !c.showOnProfile } });
            onChange();
          } catch (error) {
            Alert.alert("We couldn't change that badge.", error instanceof Error ? error.message : undefined);
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
