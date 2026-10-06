import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { BadgeCheck, FileText } from "lucide-react-native";
import { Badge, Button, Card, ErrorState, Heading, Input, Loading, Muted, Rule, Screen, Section, Small, Text, Title } from "@/components/ui";
import { api, webUrl } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { colors, fonts, radius, space } from "@/theme";
import { ChoiceList } from "@/components/profile/Fields";
import { multipart, pickImage, type PickedImage } from "@/components/profile/photo";
import { profileKey } from "@/components/profile/types";

type Verification = {
  eligible: boolean;
  isVerified: boolean;
  hasListing: boolean;
  summary: { state: "verified" | "pending" | "rejected" | "removed" | "none"; pending: number; reason?: string | null };
  sentence: string;
  maxPending: number;
  pending: number;
  limitMessage: string;
  kinds: { id: string; label: string; description: string }[];
  requests: {
    id: string;
    kind: string;
    kindLabel: string;
    title: string;
    fileUrl: string | null;
    status: "pending" | "approved" | "rejected";
    reviewNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
  }[];
};

const key = ["profile", "verification"] as const;

const STATUS: Record<Verification["requests"][number]["status"], { label: string; tone: "neutral" | "positive" | "ink" }> = {
  pending: { label: "Waiting for review", tone: "neutral" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Not approved", tone: "ink" },
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const openWeb = (path: string) => WebBrowser.openBrowserAsync(webUrl(path)).catch(() => {});

export default function VerificationScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: key, queryFn: () => api<Verification>("profile/verification") });
  const [kind, setKind] = useState("training");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: profileKey });
  };

  if (query.isPending) return <Loading />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const v = query.data;

  const send = async () => {
    if (title.trim().length < 3) {
      setNotice({ ok: false, text: "Please describe the document, for example the qualification and the year you were awarded it." });
      return;
    }
    if (!file) {
      setNotice({ ok: false, text: "Please choose a file to upload." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await api("profile/verification", { body: multipart({ kind, title: title.trim(), note: note.trim() || undefined }, { file }) });
      setTitle("");
      setNote("");
      setFile(null);
      setNotice({ ok: true, text: "Thank you. Your document has been sent to the team, and we will email you once it has been reviewed." });
      refresh();
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = (id: string) =>
    Alert.alert("Withdraw this request?", "The document will be deleted and the team will not review it.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw and delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`profile/verification/${id}`, { method: "DELETE" });
            setNotice({ ok: true, text: "Your request has been withdrawn and the document has been deleted." });
            refresh();
          } catch (error) {
            Alert.alert("We couldn't withdraw that request.", error instanceof Error ? error.message : undefined);
          }
        },
      },
    ]);

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: "Verification" }} />
      <Title>The verified badge</Title>
      <Muted>
        The verified badge tells clients and colleagues that the Trichollective team has checked your training or professional standing by hand.
        Trichology is not statutorily regulated in Ireland or the UK, so the badge gives clients a clear signal when they are choosing who to
        trust with their hair and scalp.
      </Muted>

      <Section title="What the badge means">
        <Card style={{ gap: space.sm }}>
          <Text>
            Clients see the badge on your directory profile, in directory search results and on your chapter page, so they know your
            qualifications have been checked.
          </Text>
          <Text>Colleagues can refer clients to you with more confidence, because they know someone has looked at your evidence.</Text>
          <Text>
            Your documents stay private: only you and the members of the team who review verification can open them, and they are never shown
            publicly.
          </Text>
        </Card>
      </Section>

      {!v.eligible ? (
        <Card style={{ gap: space.md }}>
          <Heading>The badge is for practitioners who see clients.</Heading>
          <Text>
            Verification is open to Professional and Business members, and to practitioners with a free listing in the Trichollective directory.
            Your current membership does not include a directory profile, so there is nowhere for the badge to appear yet.
          </Text>
          <Text>If you work with clients, you can list your practice in the directory for free or move to Professional, and then send your evidence here.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <Button title="List your practice" variant="secondary" size="sm" onPress={() => openWeb("/directory/list")} />
            <Button title="See membership" size="sm" onPress={() => router.push("/membership")} />
          </View>
        </Card>
      ) : (
        <>
          {notice && (
            <Card style={{ borderColor: notice.ok ? colors.positive : colors.destructive }}>
              <Text accessibilityRole="alert" style={{ color: notice.ok ? colors.positive : colors.destructive }}>
                {notice.text}
              </Text>
            </Card>
          )}

          <Card style={{ flexDirection: "row", gap: space.md }}>
            <BadgeCheck size={24} color={v.summary.state === "verified" ? colors.positive : colors.mute} strokeWidth={1.75} />
            <View style={{ flex: 1, gap: space.sm }}>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{v.sentence}</Text>
              {v.summary.state === "rejected" && v.summary.reason ? <Text>The reason the team gave is: {v.summary.reason}</Text> : null}
              {v.summary.state === "verified" && !v.hasListing ? (
                <Text>Publish your directory profile so clients can see the badge.</Text>
              ) : null}
            </View>
          </Card>

          <Section title="Send evidence">
            <Card style={{ gap: space.lg }}>
              <Text>
                Send a certificate, diploma or membership document that shows your name. You can send several documents, one at a time, and the
                team will review each of them.
              </Text>
              {v.pending >= v.maxPending ? (
                <Text>{v.limitMessage}</Text>
              ) : (
                <>
                  <View style={{ gap: space.sm }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>What kind of document is it?</Text>
                    <ChoiceList options={v.kinds.map((k) => ({ id: k.id, label: k.label, detail: k.description }))} value={kind} onChange={setKind} />
                  </View>
                  <Input
                    label="What the document is"
                    hint="Include the awarding body and the year, so the team can check it quickly."
                    placeholder="IAT Diploma in Trichology, 2019"
                    maxLength={160}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <View style={{ gap: space.sm }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>The document</Text>
                    {file && (
                      <Image source={{ uri: file.uri }} style={{ width: "100%", height: 180, borderRadius: radius.md }} contentFit="contain" />
                    )}
                    <Button
                      title={file ? "Choose a different photo" : "Choose a photo of the document"}
                      variant="secondary"
                      size="sm"
                      onPress={async () => {
                        const picked = await pickImage({ square: false });
                        if (picked) setFile(picked);
                      }}
                    />
                    <Small>
                      A clear photo as a JPEG, PNG or WebP, up to 9MB. Location and camera details are removed from photos. To send a PDF, use your
                      profile on trichollective.net.
                    </Small>
                  </View>
                  <Input
                    label="A note for the team (optional)"
                    placeholder="For example, if the certificate is in your maiden name."
                    multiline
                    maxLength={2000}
                    value={note}
                    onChangeText={setNote}
                  />
                  <Button title="Send for review" loading={busy} onPress={send} />
                </>
              )}
            </Card>
          </Section>

          {v.requests.length > 0 && (
            <Section title="Your documents">
              <Card style={{ padding: 0 }}>
                {v.requests.map((r, i) => (
                  <View key={r.id}>
                    {i > 0 && <Rule />}
                    <View style={{ padding: space.lg, gap: space.sm }}>
                      <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{r.title}</Text>
                          <Small>
                            {r.kindLabel} · Sent {shortDate(r.createdAt)}
                            {r.reviewedAt ? ` · Reviewed ${shortDate(r.reviewedAt)}` : ""}
                          </Small>
                        </View>
                        <Badge label={STATUS[r.status].label} tone={STATUS[r.status].tone} />
                      </View>
                      {r.status === "rejected" && r.reviewNote ? <Text>The reason the team gave is: {r.reviewNote}</Text> : null}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                        {r.fileUrl && <DocumentPreview src={r.fileUrl} />}
                        {r.status === "pending" && <Button title="Withdraw and delete" variant="ghost" size="sm" onPress={() => withdraw(r.id)} />}
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}

/** The document, shown in place when it is a photo. PDFs sent from the website open there instead. */
function DocumentPreview({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ width: "100%", gap: space.sm }}>
      <Pressable accessibilityRole="button" onPress={() => (failed ? openWeb(src) : setOpen((o) => !o))} style={{ flexDirection: "row", gap: 6, alignItems: "center", minHeight: 36 }}>
        <FileText size={16} color={colors.ink} strokeWidth={1.75} />
        <Text style={{ color: colors.ink, textDecorationLine: "underline" }}>
          {failed ? "Open your document on the website" : open ? "Hide your document" : "View your document"}
        </Text>
      </Pressable>
      {open && !failed && (
        <Image
          source={mediaUrl(src)}
          style={{ width: "100%", height: 240, borderRadius: radius.md, backgroundColor: colors.paper2 }}
          contentFit="contain"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}
