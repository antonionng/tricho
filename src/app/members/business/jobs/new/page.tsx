import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MemberPage, PageHeader } from "@/components/members/MemberPage";
import { JobForm } from "../JobForm";
import { loadPoster, Notices } from "../_shared";

export const metadata = { title: "Post a role" };

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { page, active } = await loadPoster("/members/business/jobs/new");
  if (!page?.published || page.hidden || !active) redirect("/members/business/jobs");
  const { error, message } = await searchParams;

  return (
    <MemberPage size="narrow">
      <Link href="/members/business/jobs" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your job posts
      </Link>
      <PageHeader
        label="Post a role"
        title={`Tell candidates what it's like to work at ${page.name}.`}
        lede="Your role goes live as soon as you post it, with your logo and a link to your business page."
      />
      <Notices error={error} message={message} />
      <JobForm />
    </MemberPage>
  );
}
