import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { router, Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react-native";
import { Badge, Button, Card, Empty, ErrorState, Heading, Loading, Muted, Screen, Small } from "@/components/ui";
import { Notice } from "@/components/referrals/Notice";
import { openWeb } from "@/components/business/openWeb";
import { setFlash, useFlash } from "@/components/business/flash";
import type { ActionResult, JobRow, JobsList } from "@/components/business/types";
import { api } from "@/lib/api";
import { space } from "@/theme";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function phaseLabel(job: JobRow) {
  if (job.phase === "hidden") return "Taken down by Trichollective";
  if (job.phase === "closed") return "Closed";
  if (job.phase === "ended") return "Ended";
  return `Live until ${shortDate(job.expiresAt)}`;
}

/** The business's roles on the jobs board: post, edit, close, reopen and delete. */
export default function BusinessJobsScreen() {
  const qc = useQueryClient();
  const flash = useFlash();
  const [notice, setNotice] = useState<{ tone: "positive" | "error"; text: string } | null>(null);
  const q = useQuery({ queryKey: ["business", "jobs"], queryFn: () => api<JobsList>("business/jobs") });

  // A sentence carried back from posting or editing a role, shown until the owner does something else here.
  useEffect(() => () => setFlash(null), []);
  const shown = notice ?? (flash ? { tone: "positive" as const, text: flash } : null);

  const act = useMutation({
    mutationFn: ({ job, action }: { job: JobRow; action: "close" | "reopen" | "delete" }) =>
      action === "delete"
        ? api<ActionResult>(`business/jobs/${job.id}`, { method: "DELETE" })
        : api<ActionResult>(`business/jobs/${job.id}/open`, { body: { open: action === "reopen" } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["business"] });
      setFlash(null);
      setNotice(r.message ? { tone: "positive", text: r.message } : null);
    },
    onError: (e) => setNotice({ tone: "error", text: e.message }),
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const d = q.data;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Job posts" }} />
      <Heading>Hire people already trained in hair and scalp care.</Heading>
      <Muted>{`Your roles show on the jobs board and on your business page, members are told when you post one, and each role stays up for ${d.jobDays} days.`}</Muted>
      {shown && <Notice tone={shown.tone}>{shown.text}</Notice>}

      {!d.ready ? (
        <Card style={{ gap: space.md }}>
          <Muted>
            {!d.active
              ? "Posting roles is part of the Business plan, so you can post as soon as your plan is active."
              : "Publish your business page first, so candidates can see who they would be working for."}
          </Muted>
          {d.active && <Button title="Finish your page on the website" icon={ArrowUpRight} onPress={() => openWeb("/members/business")} />}
        </Card>
      ) : (
        <Button title="Post a role" icon={Plus} full onPress={() => router.push("/business/jobs/new")} />
      )}

      {d.jobs.length === 0
        ? d.ready && <Empty title="You haven't posted a role yet." body={`You can have up to ${d.maxOpen} roles open at once.`} />
        : d.jobs.map((job) => {
            const live = job.phase === "live";
            const busy = act.isPending && act.variables?.job.id === job.id;
            return (
              <Card key={job.id} style={{ gap: space.md }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <Badge label={phaseLabel(job)} tone={live ? "positive" : "neutral"} />
                  <Badge label={job.employmentLabel} />
                </View>
                <View style={{ gap: 2 }}>
                  <Heading>{job.title}</Heading>
                  <Small>{`${job.location} · posted ${shortDate(job.createdAt)}`}</Small>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                  <Button title="Edit" size="sm" variant="secondary" disabled={busy} onPress={() => router.push(`/business/jobs/${job.id}`)} />
                  {live && <Button title="View" size="sm" variant="secondary" icon={ArrowUpRight} onPress={() => openWeb(`/jobs/${job.slug}`)} />}
                  {job.phase !== "hidden" && (
                    <Button
                      title={live ? "Close the role" : `Reopen for ${d.jobDays} days`}
                      size="sm"
                      variant="secondary"
                      loading={busy && act.variables?.action !== "delete"}
                      disabled={busy}
                      onPress={() => act.mutate({ job, action: live ? "close" : "reopen" })}
                    />
                  )}
                  <Button
                    title="Delete"
                    size="sm"
                    variant="danger"
                    loading={busy && act.variables?.action === "delete"}
                    disabled={busy}
                    onPress={() =>
                      Alert.alert(`Delete ${job.title}?`, "The role is removed from the jobs board and your page, and it can't be brought back.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => act.mutate({ job, action: "delete" }) },
                      ])
                    }
                  />
                </View>
              </Card>
            );
          })}
    </Screen>
  );
}
