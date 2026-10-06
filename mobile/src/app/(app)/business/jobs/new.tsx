import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, ErrorState, Loading, Muted, Screen, Title } from "@/components/ui";
import { JobForm } from "@/components/business/JobForm";
import type { JobsList } from "@/components/business/types";
import { api } from "@/lib/api";

/** Posting a role. It goes live as soon as it is posted. */
export default function NewJobScreen() {
  const q = useQuery({ queryKey: ["business", "jobs"], queryFn: () => api<JobsList>("business/jobs") });
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const d = q.data;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Post a role" }} />
      {!d.ready ? (
        <Empty
          title={!d.active ? "Posting roles is part of the Business plan." : "Publish your business page first."}
          body={!d.active ? "You can post as soon as your plan is active." : "Candidates see who they would be working for, so roles show under a live business page."}
        />
      ) : (
        <>
          <Title>{`Tell candidates what it's like to work at ${d.pageName}.`}</Title>
          <Muted>Your role goes live as soon as you post it, with your logo and a link to your business page.</Muted>
          <JobForm employment={d.employment} workplace={d.workplace} />
        </>
      )}
    </Screen>
  );
}
