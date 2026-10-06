import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@/components/ui";
import { Notice } from "@/components/referrals/Notice";
import { api } from "@/lib/api";
import { space } from "@/theme";
import { Choice } from "./Choice";
import { setFlash } from "./flash";
import type { ActionResult, JobDetail, JobFields, Option } from "./types";

const EMPTY: JobFields = {
  title: "",
  employment: "full_time",
  workplace: "on_site",
  location: "",
  country: "",
  pay: "",
  summary: "",
  description: "",
  applyEmail: "",
  applyUrl: "",
};

/** Posting a new role, or editing one, with the website's fields and checks. */
export function JobForm({ job, employment, workplace }: { job?: JobDetail; employment: Option[]; workplace: Option[] }) {
  const qc = useQueryClient();
  const [v, setV] = useState<JobFields>(() =>
    job ? (Object.fromEntries(Object.keys(EMPTY).map((k) => [k, job[k as keyof JobFields] ?? EMPTY[k as keyof JobFields]])) as JobFields) : EMPTY
  );
  const set = (key: keyof JobFields) => (text: string) => setV((prev) => ({ ...prev, [key]: text }));

  const save = useMutation({
    mutationFn: () => api<ActionResult>(job ? `business/jobs/${job.id}` : "business/jobs", { method: job ? "PATCH" : "POST", body: v }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["business"] });
      setFlash(r.message);
      router.back();
    },
  });

  return (
    <View style={{ gap: space.lg }}>
      <Input label="Job title" value={v.title} onChangeText={set("title")} maxLength={120} placeholder="For example, Trichologist" />
      <Choice label="Type of role" options={employment} value={v.employment} onChange={set("employment")} />
      <Choice label="Where the work happens" options={workplace} value={v.workplace} onChange={set("workplace")} />
      <Input label="Town or city" value={v.location} onChangeText={set("location")} maxLength={120} placeholder="For example, Dublin 2" />
      <Input label="Country" value={v.country} onChangeText={set("country")} maxLength={80} placeholder="For example, Ireland" />
      <Input
        label="Pay"
        value={v.pay}
        onChangeText={set("pay")}
        maxLength={120}
        placeholder="For example, €32,000 to €38,000 a year, plus commission"
        hint="Roles that show pay get more applications. Write it the way you'd say it."
      />
      <Input
        label="The role in one sentence"
        value={v.summary}
        onChangeText={set("summary")}
        maxLength={240}
        placeholder="Lead consultations for shedding and scalp conditions in a busy city clinic."
        hint="This shows on the jobs board, under the title."
      />
      <Input
        label="About the role"
        value={v.description}
        onChangeText={set("description")}
        multiline
        maxLength={8000}
        style={{ minHeight: 220 }}
        hint="What the work involves, the training or experience you need, and what you offer. Leave a blank line between paragraphs."
      />
      <Input
        label="Apply by email"
        value={v.applyEmail}
        onChangeText={set("applyEmail")}
        maxLength={160}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="jobs@yourclinic.com"
        hint="Applications go straight to this address."
      />
      <Input
        label="Or apply through a link"
        value={v.applyUrl}
        onChangeText={set("applyUrl")}
        maxLength={500}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="yourclinic.com/careers"
        hint="Your careers page or application form."
      />
      {save.error && <Notice tone="error">{save.error.message}</Notice>}
      <Button title={job ? "Save the role" : "Post the role"} full loading={save.isPending} onPress={() => save.mutate()} />
    </View>
  );
}
