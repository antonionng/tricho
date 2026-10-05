import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MemberPage, PageHeader } from "@/components/members/MemberPage";
import { prisma } from "@/lib/prisma";
import { JobForm } from "../JobForm";
import { loadPoster, Notices } from "../_shared";

export const metadata = { title: "Edit a role" };

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { id } = await params;
  const { page } = await loadPoster(`/members/business/jobs/${id}`);
  const job = page ? await prisma.job.findFirst({ where: { id, partnerId: page.id } }) : null;
  if (!job) notFound();
  const { error, message } = await searchParams;

  return (
    <MemberPage size="narrow">
      <Link href="/members/business/jobs" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your job posts
      </Link>
      <PageHeader label="Edit a role" title={job.title} lede="Changes show on the jobs board as soon as you save." />
      <Notices error={error} message={message} />
      <JobForm job={job} />
    </MemberPage>
  );
}
