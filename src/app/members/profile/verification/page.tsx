import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, ChevronLeft, FileText } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { cn } from "@/lib/utils";
import { Card, MemberPage, PageHeader, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shortDate } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import {
  MAX_PENDING_REQUESTS,
  statusSentence,
  statusSummary,
  verificationKindLabel,
  VERIFICATION_KINDS,
} from "@/lib/verification";
import { loadApplicant } from "./applicant";
import { submitVerificationAction, withdrawVerificationAction } from "./actions";

export const metadata = { title: "Verification" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  kind: "Please choose what kind of document you are sending.",
  title: "Please describe the document, for example the qualification and the year you were awarded it.",
  file: "Please choose a file to upload.",
  size: "That file is larger than 9MB. Please choose a smaller one, or a photo of the document.",
  type: "Please upload a PDF, or a photo of the document as a JPEG, PNG or WebP.",
  save: "The file could not be saved just now. Please try again in a moment.",
  limit: `You already have ${MAX_PENDING_REQUESTS} documents waiting for review. Please wait for the team to review them, or withdraw one first.`,
};

const STATUS_PILL = {
  pending: { label: "Waiting for review", tone: "default" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Not approved", tone: "ink" },
} as const;

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; withdrawn?: string; error?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/profile/verification");
  const applicant = await loadApplicant(ctx);
  if (!applicant) redirect("/login?next=/members/profile/verification");
  const { sent, withdrawn, error } = await searchParams;

  const requests = await prisma.verificationRequest.findMany({
    where: { userId: applicant.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, title: true, fileId: true, note: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
  });
  const summary = statusSummary(requests, applicant.isVerified);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <MemberPage size="narrow">
      <Link
        href="/members/profile"
        className="-ml-2 mb-4 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm text-muted-foreground hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Your profile
      </Link>

      <PageHeader
        label="Verification"
        title="The verified badge"
        lede="The verified badge tells clients and colleagues that the Trichollective team has checked your training or professional standing by hand. Trichology is not statutorily regulated in Ireland or the UK, so the badge gives clients a clear signal when they are choosing who to trust with their hair and scalp."
      />

      <Card className="mb-8 space-y-3 p-5 sm:p-6">
        <SectionLabel className="mb-3">What the badge means</SectionLabel>
        <ul className="space-y-2 text-sm leading-relaxed text-ink-2">
          <li>Clients see the badge on your directory profile, in directory search results and on your chapter page, so they know your qualifications have been checked.</li>
          <li>Colleagues can refer clients to you with more confidence, because they know someone has looked at your evidence.</li>
          <li>Your documents stay private: only you and the members of the team who review verification can open them, and they are never shown publicly.</li>
        </ul>
      </Card>

      {!applicant.eligible ? (
        <Card className="space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">The badge is for practitioners who see clients.</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Verification is open to Professional and Business members, and to practitioners with a free listing in the
            Trichollective directory. Your current membership does not include a directory profile, so there is nowhere for the
            badge to appear yet.
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            If you work with clients, you can{" "}
            <Link href="/directory/list" className="underline underline-offset-4">
              list your practice in the directory
            </Link>{" "}
            for free or{" "}
            <Link href="/members/billing" className="underline underline-offset-4">
              move to Professional
            </Link>
            , and then send your evidence here.
          </p>
        </Card>
      ) : (
        <>
          {sent && (
            <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
              Thank you. Your document has been sent to the team, and we will email you once it has been reviewed.
            </p>
          )}
          {withdrawn && (
            <p className="mb-6 rounded-2xl border border-rule bg-card px-4 py-3 text-sm text-ink-2" role="status">
              Your request has been withdrawn and the document has been deleted.
            </p>
          )}

          <Card className="mb-8 flex items-start gap-4 p-5 sm:p-6">
            <BadgeCheck
              className={summary.state === "verified" ? "mt-0.5 h-6 w-6 shrink-0 text-positive" : "mt-0.5 h-6 w-6 shrink-0 text-muted-foreground"}
              aria-hidden
            />
            <div className="min-w-0 space-y-2">
              <p className="text-[15px] font-medium leading-relaxed">{statusSentence(summary)}</p>
              {summary.state === "rejected" && summary.reason && (
                <p className="text-sm leading-relaxed text-ink-2">The reason the team gave is: {summary.reason}</p>
              )}
              {summary.state === "verified" && !applicant.hasListing && (
                <p className="text-sm leading-relaxed text-ink-2">
                  Publish your{" "}
                  <Link href="/members/profile#listing" className="underline underline-offset-4">
                    directory profile
                  </Link>{" "}
                  so clients can see the badge.
                </p>
              )}
            </div>
          </Card>

          <section id="send" className="mb-10 scroll-mt-24">
            <SectionLabel>Send evidence</SectionLabel>
            <Card className="p-5 sm:p-6">
              <p className="mb-5 text-sm leading-relaxed text-ink-2">
                Send a certificate, diploma or membership document that shows your name. You can send several documents, one at a
                time, and the team will review each of them.
              </p>
              {error && ERRORS[error] && (
                <p className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
                  {ERRORS[error]}
                </p>
              )}
              {pendingCount >= MAX_PENDING_REQUESTS ? (
                <p className="text-sm leading-relaxed text-ink-2">{ERRORS.limit}</p>
              ) : (
                <form action={submitVerificationAction} className="space-y-5">
                  <fieldset className="space-y-2">
                    <legend className="mb-1 text-sm font-medium">What kind of document is it?</legend>
                    {VERIFICATION_KINDS.map((k, i) => (
                      <label
                        key={k.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-rule p-3 has-[:checked]:border-ink/50 has-[:checked]:bg-paper-2"
                      >
                        <input type="radio" name="kind" value={k.id} defaultChecked={i === 0} required className="mt-1" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{k.label}</span>
                          <span className="block text-xs leading-relaxed text-muted-foreground">{k.description}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">What the document is</span>
                    <input
                      name="title"
                      required
                      minLength={3}
                      maxLength={160}
                      placeholder="IAT Diploma in Trichology, 2019"
                      className={cn(fieldClass, "h-12")}
                    />
                    <span className="text-xs text-muted-foreground">Include the awarding body and the year, so the team can check it quickly.</span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">The document</span>
                    <input
                      type="file"
                      name="file"
                      required
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="block w-full text-sm file:mr-3 file:rounded-full file:border file:border-rule file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium hover:file:border-ink/40"
                    />
                    <span className="text-xs text-muted-foreground">
                      A PDF, or a clear photo as a JPEG, PNG or WebP, up to 9MB. Location and camera details are removed from photos.
                    </span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">A note for the team (optional)</span>
                    <textarea
                      name="note"
                      rows={3}
                      maxLength={2000}
                      placeholder="For example, if the certificate is in your maiden name."
                      className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
                    />
                  </label>

                  <SubmitButton pending="Sending…">Send for review</SubmitButton>
                </form>
              )}
            </Card>
          </section>

          {requests.length > 0 && (
            <section>
              <SectionLabel>Your documents</SectionLabel>
              <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
                {requests.map((r) => {
                  const pill = STATUS_PILL[r.status];
                  return (
                    <li key={r.id} className="space-y-2 px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {verificationKindLabel(r.kind)} · Sent {shortDate(r.createdAt)}
                            {r.reviewedAt && ` · Reviewed ${shortDate(r.reviewedAt)}`}
                          </p>
                        </div>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </div>
                      {r.status === "rejected" && r.reviewNote && (
                        <p className="text-sm leading-relaxed text-ink-2">The reason the team gave is: {r.reviewNote}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {r.fileId && (
                          <a
                            href={`/api/files/${r.fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 underline underline-offset-4"
                          >
                            <FileText className="h-4 w-4" /> View your document
                          </a>
                        )}
                        {r.status === "pending" && (
                          <form action={withdrawVerificationAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <SubmitButton variant="ghost" size="sm" pending="Withdrawing…">
                              Withdraw and delete
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </MemberPage>
  );
}
