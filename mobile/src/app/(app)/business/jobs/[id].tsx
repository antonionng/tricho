import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Loading, Muted, Screen, Title } from "@/components/ui";
import { JobForm } from "@/components/business/JobForm";
import type { JobDetail, JobsList } from "@/components/business/types";
import { api } from "@/lib/api";

/** Editing one of the business's roles. Changes show on the jobs board as soon as they are saved. */
export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job = useQuery({ queryKey: ["business", "job", id], queryFn: () => api<JobDetail>(`business/jobs/${id}`) });
  const list = useQuery({ queryKey: ["business", "jobs"], queryFn: () => api<JobsList>("business/jobs") });

  if (job.isLoading || list.isLoading) return <Loading />;
  if (job.error || !job.data) return <ErrorState error={job.error} onRetry={job.refetch} />;
  if (list.error || !list.data) return <ErrorState error={list.error} onRetry={list.refetch} />;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Edit a role" }} />
      <Title>{job.data.title}</Title>
      <Muted>Changes show on the jobs board as soon as you save.</Muted>
      <JobForm key={job.data.id} job={job.data} employment={list.data.employment} workplace={list.data.workplace} />
    </Screen>
  );
}
