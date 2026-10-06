import { useCallback, useState, type ReactNode } from "react";
import { View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Button, Display, ErrorState, Input, Label, Loading, Muted, Screen, Small, Text } from "@/components/ui";
import { api, webUrl } from "@/lib/api";
import { appHref } from "@/lib/links";
import { meKey } from "@/lib/me";
import { colors, radius, space } from "@/theme";
import { draftFrom, fieldsFor, type Draft, type FieldGroup } from "@/components/profile/draft";
import { ChoiceList, ContactFields, GoalsFields, IdentityFields, PracticeFields, QualificationFields } from "@/components/profile/Fields";
import { PhotoField, multipart, type PickedImage } from "@/components/profile/photo";
import { profileKey, type OnboardingResponse, type SaveResult } from "@/components/profile/types";

const key = ["onboarding"] as const;

/** The website's first-run steps: discipline, photo, practice, training, contact, goals, chapter and hello. */
export default function OnboardingScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: key, queryFn: () => api<OnboardingResponse>("onboarding"), staleTime: Infinity });
  const data = query.data;
  const [step, setStep] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hasProfession, setHasProfession] = useState(false);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fill the steps once, from the first load.
  if (data && !draft) {
    setStep(data.step);
    setHasProfession(!!data.profession);
    setDraft(
      draftFrom(data.profile, {
        name: data.user.name,
        profession: data.profession,
        chapter: data.user.chapter?.slug ?? "",
        fallbackCity: data.user.chapter?.city,
        knownBodies: data.options.membershipBodies.map((b) => b.id),
        extraRows: 0,
      })
    );
  }

  const set = useCallback(<K extends keyof Draft>(k: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: value } : d)), []);

  if (query.isPending) return <Loading />;
  if (query.error || !data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!draft || step === null) return <Loading />;

  const total = data.steps.length;
  const { options, free } = data;
  const optionalNote = free
    ? " This step is optional on a free account, so you can skip it and add the details from your profile later."
    : "";

  const go = (next: number) => {
    setError(null);
    setStep(next);
  };

  const finish = (redirect?: string) => {
    qc.invalidateQueries({ queryKey: meKey });
    qc.invalidateQueries({ queryKey: profileKey });
    qc.removeQueries({ queryKey: key });
    const target = appHref(redirect ?? "/members");
    if (target && typeof target === "object" && "web" in target) {
      router.replace("/");
      WebBrowser.openBrowserAsync(webUrl(target.web)).catch(() => {});
    } else router.replace((target as Href | null) ?? "/");
  };

  const submit = async (skip: boolean, groups: FieldGroup[] = [], extra: Record<string, string> = {}) => {
    if (step === 1 && !draft.profession) {
      setError("Please choose the option closest to your work.");
      return;
    }
    if (step === 7 && !skip && !draft.chapter) {
      setError("Please choose a chapter, or none for now.");
      return;
    }
    setBusy(skip ? "skip" : "save");
    setError(null);
    try {
      const fields = skip
        ? { step: String(step), intent: "skip" }
        : { step: String(step), ...fieldsFor(groups, draft, options.socials.map((s) => s.key)), ...extra };
      const res = await api<SaveResult>("onboarding", {
        body: step === 2 && photo && !skip ? multipart(fields, { photo }) : fields,
      });
      if (step === 1) setHasProfession(true);
      if (step === 2 && !skip) setPhoto(null);
      if (res.done) finish(res.redirect);
      else if (res.step) go(res.step);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  // The discipline comes first; later steps make little sense without it.
  const current = step > 1 && !hasProfession ? 1 : step;

  const footer = (groups: FieldGroup[], { skip = true, label = "Continue", extra }: { skip?: boolean; label?: string; extra?: Record<string, string> } = {}) => (
    <View style={{ gap: space.md }}>
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
        <Button title={label} loading={busy === "save"} disabled={!!busy} onPress={() => submit(false, groups, extra)} />
        {skip && <Button title="Skip for now" variant="ghost" loading={busy === "skip"} disabled={!!busy} onPress={() => submit(true)} />}
        {current > 1 && <Button title="Back" variant="ghost" disabled={!!busy} onPress={() => go(current - 1)} />}
      </View>
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: "Welcome" }} />
      <View accessibilityRole="progressbar" accessibilityLabel="Progress" accessibilityValue={{ min: 1, max: total, now: current }} style={{ flexDirection: "row", gap: 6 }}>
        {data.steps.map((s, i) => (
          <View key={s.id} style={{ flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: i + 1 <= current ? colors.ink : colors.paper3 }} />
        ))}
      </View>

      {current === 1 && (
        <>
          <Header label="Welcome to Trichollective" title="Which best describes your work?">
            This helps us show you the conversations and learning most relevant to you. You can change it later.
          </Header>
          <Input label="Your name" autoComplete="name" textContentType="name" maxLength={80} value={draft.name} onChangeText={(v) => set("name", v)} />
          <ChoiceList
            options={options.professions.map((p) => ({ id: p.id, label: p.label, detail: p.blurb }))}
            value={draft.profession}
            onChange={(v) => set("profession", v)}
          />
          {footer([], { skip: false, extra: { name: draft.name.trim(), profession: draft.profession } })}
        </>
      )}

      {current === 2 && (
        <>
          <Header label={`Step 2 of ${total}`} title="Add your photo and where you practise.">
            Colleagues refer more readily to someone they can picture. Your photo, headline and town appear on your member profile, and on your
            directory listing if you have one.
          </Header>
          <PhotoField name={draft.name} url={data.photoUrl} picked={photo} onPick={setPhoto} />
          <IdentityFields draft={draft} set={set} options={options} />
          {footer(["identity"])}
        </>
      )}

      {current === 3 && (
        <>
          <Header label={`Step 3 of ${total}`} title="Tell colleagues what you specialise in.">
            {`Your specialisms and services help other professionals know when to refer a client to you, and help members find the right person for a case.${optionalNote}`}
          </Header>
          <PracticeFields draft={draft} set={set} />
          {footer(["practice"])}
        </>
      )}

      {current === 4 && (
        <>
          <Header label={`Step 4 of ${total}`} title="Add your qualifications and professional memberships.">
            {`Listing your training and the bodies you belong to shows clients and colleagues the standard you work to. Add your main qualifications now and the rest on your profile at any time.${optionalNote}`}
          </Header>
          <QualificationFields draft={draft} set={set} options={options} />
          {footer(["qualifications"])}
        </>
      )}

      {current === 5 && (
        <>
          <Header label={`Step 5 of ${total}`} title="Add the ways people can find and contact you.">
            {`Your website and social profiles can appear on your public profile so clients can see your work.${optionalNote}`}
          </Header>
          <ContactFields draft={draft} set={set} options={options} />
          {footer(["contact"])}
        </>
      )}

      {current === 6 && (
        <>
          <Header label={`Step 6 of ${total}`} title="Choose what you would like from Trichollective.">
            We use your answers to suggest people, discussions and learning that match your goals. Only you can see them.
          </Header>
          <GoalsFields draft={draft} set={set} options={options} />
          {footer(["goals"])}
        </>
      )}

      {current === 7 && (
        <>
          <Header label={`Step 7 of ${total}`} title="Choose your local chapter.">
            Your chapter is the group of members near you, so you will see local posts, meetups and people to meet.
          </Header>
          <ChoiceList
            options={[
              ...options.chapters.map((c) => ({ id: c.slug, label: c.city, detail: c.country })),
              {
                id: "none",
                label: "None near me yet",
                detail: "You will still see everything, and we will let you know when a chapter opens nearby.",
              },
            ]}
            value={draft.chapter}
            onChange={(v) => set("chapter", v)}
          />
          {footer([], { extra: { chapter: draft.chapter } })}
        </>
      )}

      {current === 8 && free && (
        <>
          <Header label={`Step 8 of ${total}`} title="Your free account is ready to use.">
            You can add your free founding listing, read the opening pages of every Trichozette edition and follow the news. When you want peer
            review, CPD and referrals, you can become a member from your home page.
          </Header>
          {footer([], { skip: false, label: "Go to my free account" })}
        </>
      )}

      {current === 8 && !free && (
        <>
          <Header label={`Step 8 of ${total}`} title="Introduce yourself to the community.">
            A few lines in Introductions is the easiest way to be welcomed. Say what you do, where you practise and what you would like to learn.
            You can leave this empty and introduce yourself later.
          </Header>
          <Input
            multiline
            maxLength={3000}
            value={intro}
            onChangeText={setIntro}
            accessibilityLabel="Your introduction"
            placeholder="Hello, I'm a head spa therapist in Cork. I've been practising for four years and I'd love to learn more about when to refer clients on."
          />
          {footer([], { skip: false, label: "Finish and go to Introductions", extra: { intro: intro.trim() } })}
          <Small>If you leave the box empty, nothing is posted.</Small>
        </>
      )}
    </Screen>
  );
}

function Header({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.md }}>
      <Label>{label}</Label>
      <Display>{title}</Display>
      <Muted style={{ color: colors.ink2 }}>{children}</Muted>
    </View>
  );
}
