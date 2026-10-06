import { body, fail, formData, json, withMember } from "@/lib/mobile/api";
import { captureRedirect } from "@/lib/mobile/form-action";
import { idAfter, redirectParams } from "@/lib/mobile/redirect-outcome";
import { REFERRAL_STATUS_LABEL } from "@/lib/client-referrals";
import { listReferrals } from "@/app/members/referrals/_data";
import { createReferral } from "@/app/members/referrals/actions";

/** The member's received or sent referrals (?tab=sent), with the counts for each tab. */
export const GET = withMember(
  async (req, ctx) => {
    const tab = new URL(req.url).searchParams.get("tab") === "sent" ? "sent" : "received";
    const { rows, receivedCount, sentCount, waiting } = await listReferrals(ctx.session.user.id, tab);
    return json({
      tab,
      counts: { received: receivedCount, sent: sentCount, waiting },
      professional: ctx.professional,
      referrals: rows.map((r) => {
        const other = tab === "sent" ? r.to : r.from;
        return {
          id: r.id,
          status: r.status,
          statusLabel: REFERRAL_STATUS_LABEL[r.status],
          isNew: tab === "received" && r.status === "sent",
          preview: r.reason || r.clientContext || "Open the referral to read the summary.",
          createdAt: r.createdAt,
          respondedAt: r.respondedAt,
          other,
        };
      }),
    });
  },
  { members: true }
);

/**
 * Sends a referral: { to, summary, reason?, clientContext?, confirm? }. When the summary
 * may identify the client, it answers { needsConfirm, findings } and is sent again with
 * confirm: true once the member has checked it, exactly as on the website.
 */
export const POST = withMember(
  async (req) => {
    const b = await body<{ to: string; summary: string; reason: string; clientContext: string; confirm: boolean }>(req);
    const { redirect, result } = await captureRedirect(() =>
      createReferral(
        null,
        formData({
          to: b.to,
          summary: b.summary,
          reason: b.reason,
          clientContext: b.clientContext,
          confirm: b.confirm ? "yes" : undefined,
        })
      )
    );
    if (redirect) {
      const id = idAfter(redirect, "/members/referrals/");
      if (!id) return fail(400, redirectParams(redirect).get("error") ?? "The referral could not be sent. Please try again.");
      return json({ ok: true, id });
    }
    if (result?.error) return json({ ok: false, error: result.error, findings: result.findings ?? [] }, 400);
    return json({ ok: false, needsConfirm: !!result?.needsConfirm, findings: result?.findings ?? [] });
  },
  { members: true }
);
