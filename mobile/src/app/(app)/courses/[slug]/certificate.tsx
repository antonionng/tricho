import { useState } from "react";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { Check, ExternalLink, Eye, EyeOff, Link2, Share2 } from "lucide-react-native";
import { Button, Card, ErrorState, Heading, Label, Loading, Muted, Screen, Small, Text } from "@/components/ui";
import { CertificateCard } from "@/components/courses/CertificateCard";
import { longDate, type CertificateData } from "@/components/courses/types";
import { api } from "@/lib/api";
import { colors, fonts, space } from "@/theme";

export default function CertificateScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();
  const key = ["courses", "certificate", slug];
  const query = useQuery({ queryKey: key, queryFn: () => api<CertificateData>(`courses/${slug}/certificate`) });
  const [copied, setCopied] = useState(false);
  const toggle = useMutation({
    mutationFn: (show: boolean) => api(`courses/${slug}/certificate`, { body: { show } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (query.isLoading) return <Loading />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const { certificate, record } = query.data;
  const withdrawn = !!certificate.withdrawnAt;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <Stack.Screen options={{ title: "Certificate" }} />

      {withdrawn && (
        <Card style={{ borderColor: colors.destructive }}>
          <Text>
            This certificate was withdrawn on {longDate(certificate.withdrawnAt)}
            {certificate.withdrawnNote ? `. ${certificate.withdrawnNote.replace(/\.$/, "")}` : ""}. If you think this is a mistake, write to {query.data.contactEmail}.
          </Text>
        </Card>
      )}

      <CertificateCard
        holderName={certificate.holderName}
        courseTitle={certificate.courseTitle}
        hours={certificate.hours}
        issuedAt={certificate.issuedAt}
        reviewer={query.data.reviewer}
        url={query.data.url}
        withdrawn={withdrawn}
      />

      {!withdrawn && (
        <>
          <View style={{ gap: space.md }}>
            <Label>Share it</Label>
            <Muted>Anyone with the link can check this certificate is genuine. Add it to your website, your LinkedIn profile or a job application.</Muted>
            <Button
              title="Share the certificate"
              icon={Share2}
              full
              onPress={() =>
                Share.share(
                  // iOS shares the link alongside the message; Android only shares the message.
                  Platform.OS === "ios"
                    ? { message: `I've completed ${certificate.courseTitle} with Trichollective.`, url: query.data.url }
                    : { message: `I've completed ${certificate.courseTitle} with Trichollective. ${query.data.url}` }
                ).catch(() => {})
              }
            />
            <Button
              title={copied ? "Link copied" : "Copy the public link"}
              icon={copied ? Check : Link2}
              variant="secondary"
              full
              onPress={async () => {
                await Clipboard.setStringAsync(query.data.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
            <Button
              title="Add to LinkedIn"
              icon={ExternalLink}
              variant="secondary"
              full
              onPress={() => Linking.openURL(query.data.linkedIn).catch(() => WebBrowser.openBrowserAsync(query.data.linkedIn))}
            />
          </View>

          <View style={{ gap: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingTop: space.lg }}>
            <Label>Your profile badge</Label>
            <Muted>
              {certificate.showOnProfile
                ? "A badge for this course shows on your profile and your directory listing, linked to this certificate."
                : "This course is hidden from your profile and your directory listing."}
            </Muted>
            <Button
              title={certificate.showOnProfile ? "Hide from my profile" : "Show on my profile"}
              icon={certificate.showOnProfile ? EyeOff : Eye}
              variant="secondary"
              loading={toggle.isPending}
              onPress={() => toggle.mutate(!certificate.showOnProfile)}
            />
            {toggle.error && <Small style={{ color: colors.destructive }}>{toggle.error.message}</Small>}
          </View>
        </>
      )}

      <View style={{ gap: space.md }}>
        <Label>Your CPD record</Label>
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.md }}>
            <Fact label="Name" value={certificate.holderName} />
            <Fact label="Activity" value="Online course" />
            <Fact label="Hours" value={String(certificate.hours)} />
            <Fact label="Final assessment" value={`${certificate.score} of ${certificate.total}`} />
          </View>
          {record.map((l, i) => (
            <View key={l.slug} style={{ gap: space.sm, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.rule }}>
              <Heading style={{ fontSize: 16 }}>
                {i + 1}. {l.title}
              </Heading>
              {(l.completedAt || l.checkScore != null) && (
                <Small>
                  {l.completedAt ? `Completed ${longDate(l.completedAt)}` : ""}
                  {l.checkScore != null ? ` · Check ${l.checkScore}/${l.checkTotal}` : ""}
                </Small>
              )}
              <Small>Reflection: {l.reflectionPrompt}</Small>
              {l.reflection.trim() ? <Text selectable>{l.reflection}</Text> : <Muted>No reflection written.</Muted>}
              {!!l.notes.trim() && (
                <View style={{ gap: 4 }}>
                  <Small>Your notes</Small>
                  <Text selectable style={{ fontSize: 14, lineHeight: 20 }}>
                    {l.notes}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </Card>
        <Small>To print your certificate and CPD record, open this course on trichollective.net.</Small>
      </View>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "50%", gap: 2, paddingRight: space.sm }}>
      <Small>{label}</Small>
      <Text style={{ fontFamily: fonts.sansSemibold, color: colors.ink, fontSize: 14 }}>{value}</Text>
    </View>
  );
}
