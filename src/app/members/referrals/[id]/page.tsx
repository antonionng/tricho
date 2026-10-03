import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { Card, MemberPage, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { longDate } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { NOTE_MAX, REFERRAL_STATUS_LABEL, nextReferralStatus, statusSentence } from "@/lib/client-referrals";
import { shortName } from "@/lib/names";
import { cn } from "@/lib/utils";
import { startConversation } from "../../people/actions";
import { respondToReferral } from "../actions";

export const metadata = { title: "Referral" };

export default async function ReferralPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; answered?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect(`/login?next=/members/referrals/${id}`);
  if (!ctx.allowed) return <Paywall title="Referrals" body="Referring clients to colleagues is part of membership." />;

  const person = { select: { id: true, name: true, image: true } };
  const referral = await prisma.referral.findUnique({
    where: { id },
    select: {
      id: true,
      fromId: true,
      toId: true,
      summary: true,
      reason: true,
      clientContext: true,
      status: true,
      responseNote: true,
      respondedAt: true,
      createdAt: true,
      from: person,
      to: person,
    },
  });
  // Only the two members involved can open a referral.
  if (!referral || (referral.fromId !== me && referral.toId !== me)) notFound();

  const isRecipient = referral.toId === me;
  let status = referral.status;
  const opened = nextReferralStatus(status, "open", isRecipient);
  if (opened.ok && opened.changed) {
    await prisma.referral.updateMany({ where: { id, status: "sent" }, data: { status: opened.status } });
    status = opened.status;
  }
  if (isRecipient || status === "accepted" || status === "declined") {
    await prisma.notification
      .updateMany({ where: { userId: me, href: `/members/referrals/${id}`, readAt: null }, data: { readAt: new Date() } })
      .catch(() => null);
  }

  const other = isRecipient ? referral.from : referral.to;
  const otherShort = shortName(other.name, "your colleague");
  const canRespond = isRecipient && (status === "sent" || status === "seen");

  return (
    <MemberPage size="narrow">
      <Link href={isRecipient ? "/members/referrals" : "/members/referrals?tab=sent"} className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All referrals
      </Link>

      {sp.sent && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          Your referral has been sent. {otherShort} has been notified, and you will hear back here and by email when they respond.
        </p>
      )}
      {sp.answered && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          Your answer has been sent to {otherShort}. You can message them to arrange the next step.
        </p>
      )}
      {sp.error && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {sp.error.slice(0, 200)}
        </p>
      )}

      <section className="rounded-3xl border border-rule bg-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <Avatar name={other.name} src={[other.image]} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="label text-muted-foreground">{isRecipient ? "Referral from" : "Referral to"}</p>
            <h1 className="display mt-1 text-3xl">
              <Link href={`/members/people/${other.id}`} className="hover:underline">
                {other.name || "A member"}
              </Link>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Sent on {longDate(referral.createdAt)}</p>
          </div>
          <Pill tone={status === "accepted" ? "positive" : status === "sent" && isRecipient ? "ink" : "default"}>{REFERRAL_STATUS_LABEL[status]}</Pill>
        </div>

        <p className="mt-5 text-[15px] text-ink-2">{statusSentence(status, otherShort, isRecipient ? "received" : "sent")}</p>

        <dl className="mt-6 flex flex-col gap-5 text-[15px]">
          <div>
            <dt className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">The client&apos;s concern</dt>
            <dd className="whitespace-pre-line leading-relaxed text-ink">{referral.summary}</dd>
          </div>
          {referral.reason && (
            <div>
              <dt className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">Why this referral</dt>
              <dd className="text-ink">{referral.reason}</dd>
            </div>
          )}
          {referral.clientContext && (
            <div>
              <dt className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">Context</dt>
              <dd className="text-ink">{referral.clientContext}</dd>
            </div>
          )}
          {referral.respondedAt && (
            <div>
              <dt className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {status === "accepted" ? "Accepted" : "Declined"} on {longDate(referral.respondedAt)}
              </dt>
              <dd className="whitespace-pre-line text-ink">
                {referral.responseNote || (isRecipient ? "You did not leave a note." : `${otherShort} did not leave a note.`)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <form action={startConversation}>
            <input type="hidden" name="userId" value={other.id} />
            <SubmitButton variant="outline" pending="Opening…">
              <MessageCircle className="h-4 w-4" /> Message {otherShort}
            </SubmitButton>
          </form>
        </div>
      </section>

      {canRespond && (
        <section className="mt-8">
          <SectionLabel>Your answer</SectionLabel>
          <Card className="p-5 sm:p-6">
            <form action={respondToReferral} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={referral.id} />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">A note for {otherShort} (optional)</span>
                <textarea
                  name="note"
                  rows={4}
                  maxLength={NOTE_MAX}
                  placeholder="For example, when you can see the client and how they should get in touch, or a colleague who may be better placed to help."
                  className={cn(fieldClass, "resize-y py-3")}
                />
                <span className="text-xs text-muted-foreground">
                  {otherShort} is told straight away. Please keep the note free of the client&apos;s personal details.
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  name="decision"
                  value="accept"
                  className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-medium text-paper"
                >
                  Accept the referral
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="decline"
                  className="inline-flex h-12 items-center rounded-full border border-rule px-6 text-[15px] font-medium text-ink hover:border-ink/40"
                >
                  Decline the referral
                </button>
              </div>
            </form>
          </Card>
        </section>
      )}
    </MemberPage>
  );
}
